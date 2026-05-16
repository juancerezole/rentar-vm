// Bus de notificaciones desacoplado.
// Cualquier parte de la app (interceptor axios, error handler, etc.) puede
// emitir notificaciones sin tener acceso al estado de React.
// El componente <Toaster /> escucha el evento y renderiza los toasts.

export const NOTIFY_EVENT = 'rentar:notify';

export function notify(type, message) {
  window.dispatchEvent(new CustomEvent(NOTIFY_EVENT, { detail: { type, message } }));
}

export const notifyError = (m) => notify('error', m);
export const notifySuccess = (m) => notify('success', m);
export const notifyInfo    = (m) => notify('info', m);
