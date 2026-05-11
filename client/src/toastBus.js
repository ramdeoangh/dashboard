/**
 * Imperative toasts for the whole app (API client + any module).
 * Wired to React in ToastProvider via setToastListener.
 */
let emit = null;

export function setToastListener(fn) {
  emit = typeof fn === 'function' ? fn : null;
}

export function toastSuccess(message) {
  emit?.({ type: 'success', message: String(message) });
}

export function toastError(message) {
  emit?.({ type: 'error', message: String(message) });
}

export function toastInfo(message) {
  emit?.({ type: 'info', message: String(message) });
}

export function extractApiErrorMessage(err) {
  const d = err?.response?.data;
  if (d?.details?.fieldErrors) {
    const flat = Object.values(d.details.fieldErrors)
      .flat()
      .filter(Boolean);
    if (flat.length) return String(flat[0]);
  }
  if (d?.error) return String(d.error);
  if (err?.message) return String(err.message);
  return 'Something went wrong';
}

export function toastApiError(err) {
  toastError(extractApiErrorMessage(err));
}
