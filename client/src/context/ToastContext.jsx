import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setToastListener, toastError, toastInfo, toastSuccess } from '../toastBus.js';

const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = 5200;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToastListener((payload) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const duration = payload.duration ?? DEFAULT_DURATION_MS;
      setToasts((prev) => [...prev, { id, type: payload.type, message: payload.message }].slice(-8));
      if (duration > 0) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    });
    return () => setToastListener(null);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      dismiss,
      success: toastSuccess,
      error: toastError,
      info: toastInfo,
    }),
    [dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`toast toast-${t.type}`}
          >
            <span className="toast-text">{t.message}</span>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
      <style>{`
        .toast-stack {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: min(420px, calc(100vw - 32px));
          pointer-events: none;
        }
        .toast-stack .toast {
          pointer-events: auto;
        }
        .toast {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          font-size: 14px;
          line-height: 1.35;
          animation: toast-in 0.22s ease-out;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .toast-text {
          flex: 1;
          min-width: 0;
          word-break: break-word;
        }
        .toast-close {
          flex-shrink: 0;
          background: transparent;
          border: none;
          color: inherit;
          opacity: 0.75;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          padding: 0 0 0 8px;
          margin: -4px 0;
        }
        .toast-close:hover {
          opacity: 1;
        }
        .toast-success {
          background: linear-gradient(135deg, #0d3d3f, #124f52);
          color: var(--teal-light, #c0e6f5);
          border-color: rgba(44, 198, 210, 0.35);
        }
        .toast-error {
          background: linear-gradient(135deg, #3a1518, #4a1f24);
          color: #f5d0d0;
          border-color: rgba(192, 57, 43, 0.45);
        }
        .toast-info {
          background: linear-gradient(135deg, #1a2840, #243352);
          color: var(--teal-light, #c0e6f5);
          border-color: rgba(106, 198, 205, 0.35);
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      dismiss: () => {},
      success: toastSuccess,
      error: toastError,
      info: toastInfo,
    };
  }
  return ctx;
}
