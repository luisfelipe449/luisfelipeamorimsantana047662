/**
 * Utility function to extract error message from various error types
 * @param error - The error object
 * @param defaultMessage - Default message if no specific error message is found
 * @returns The error message string
 */
export function getErrorMessage(error: any, defaultMessage: string = 'Ocorreu um erro'): string {
  // Handle HTTP error responses
  if (error?.error?.message) {
    return error.error.message;
  }

  // Handle string error messages
  if (typeof error === 'string') {
    return error;
  }

  // Handle standard Error objects
  if (error?.message) {
    return error.message;
  }

  // Handle status text from HTTP responses
  if (error?.statusText) {
    return error.statusText;
  }

  // Return default message if no specific error found
  return defaultMessage;
}