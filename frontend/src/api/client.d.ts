export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status?: number, code?: string);
}
export function apiRequest<T>(path: string, options?: RequestInit, message?: string): Promise<T>;
