import { HttpErrorResponse } from '@angular/common/http';

const DEFAULT_FALLBACK = 'Ha ocurrido un error inesperado.';

const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  0: 'No se pudo conectar con el servidor. Revisa tu conexión.',
  401: 'Tu sesión ha caducado. Inicia sesión de nuevo.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso no existe o ha sido eliminado.',
  429: 'Demasiados intentos. Espera un momento y vuelve a probar.',
};

export interface ErrorMessageOptions {
  /** Message when nothing more specific is known. */
  fallback?: string;
  /** Messages for specific HTTP statuses, taking precedence over the defaults. */
  byStatus?: Readonly<Record<number, string>>;
}

/** Turns an API error into a message for the user. */
export function errorMessage(error: unknown, options: ErrorMessageOptions = {}): string {
  const fallback = options.fallback ?? DEFAULT_FALLBACK;
  if (!(error instanceof HttpErrorResponse)) return fallback;

  const known = options.byStatus?.[error.status] ?? STATUS_MESSAGES[error.status];
  if (known) return known;

  const message: unknown = (error.error as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join('. ');
  if (typeof message === 'string') return message;
  return error.status >= 500 ? 'Error del servidor. Inténtalo más tarde.' : fallback;
}

/** Whether an error is an HTTP response with the given status. */
export function hasStatus(error: unknown, status: number): boolean {
  return error instanceof HttpErrorResponse && error.status === status;
}
