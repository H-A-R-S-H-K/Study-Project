import axios from 'axios';

/**
 * Normalises any thrown error into a user-facing string. The backend always
 * returns `{ success:false, message, details? }`, so we surface `message` when
 * present and fall back to a generic line otherwise.
 */
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return 'Network error. Check your connection.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
