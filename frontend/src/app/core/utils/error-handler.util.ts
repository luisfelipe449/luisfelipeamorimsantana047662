/**
 * Utility function to extract error message from HTTP errors
 * Prioritizes interceptor messages over default messages
 */
export function getErrorMessage(error: any, defaultMessage: string): string {
  // Priority 1: Message from interceptor (error.error.message)
  if (error?.error?.message) {
    return error.error.message;
  }

  // Priority 2: Direct error message
  if (error?.message) {
    return error.message;
  }

  // Priority 3: Default message
  return defaultMessage;
}