import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import * as authService from '../services/authService.js';
import { env } from '../config/env.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(500),
});

const REFRESH_COOKIE = 'refreshToken';

function refreshCookieOpts() {
  return {
    httpOnly: true,
    secure: env.refreshCookieSecure,
    sameSite: env.refreshCookieSameSite,
    path: '/api/auth',
    maxAge: env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000,
  };
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    path: '/api/auth',
    httpOnly: true,
    secure: env.refreshCookieSecure,
    sameSite: env.refreshCookieSameSite,
  });
}

router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.validated.body;
    const result = await authService.login(username, password);
    if (result.error) {
      return res.status(401).json({ success: false, error: result.error });
    }
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOpts());
    const payload = {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
        ...(env.refreshTokenAllowBodyAuth ? { refreshToken: result.refreshToken } : {}),
      },
    };
    res.json(payload);
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const fromBody =
      typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : '';
    const token = req.cookies?.[REFRESH_COOKIE] || fromBody || null;
    if (!token) {
      return res.status(401).json({ success: false, error: 'No refresh token' });
    }
    const result = await authService.refresh(token);
    if (result.error) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, error: result.error });
    }
    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const fromBody =
      typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : '';
    const token = req.cookies?.[REFRESH_COOKIE] || fromBody || null;
    await authService.logout(token);
    clearRefreshCookie(res);
    res.json({ success: true });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.loadUserAuthz(req.auth.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const nav = await authService.getNavForUser(user.roles);
    res.json({
      success: true,
      data: {
        user: {
          ...user,
          adminNav: nav,
        },
      },
    });
  })
);

export default router;
