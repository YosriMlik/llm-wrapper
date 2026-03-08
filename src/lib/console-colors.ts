export const RED    = '\x1b[31m';
export const GREEN  = '\x1b[32m';
export const YELLOW = '\x1b[33m';
export const BLUE   = '\x1b[34m';
export const MAGENTA= '\x1b[35m';
export const CYAN   = '\x1b[36m';
export const RESET  = '\x1b[0m';

/** Returns color based on HTTP status code: 2xx=green, 3xx=magenta, 4xx=yellow, 5xx=red */
export function statusColor(status: number): string {
  if (status >= 500) return RED;
  if (status >= 400) return YELLOW;
  if (status >= 300) return MAGENTA;
  if (status >= 200) return GREEN;
  return RESET;
}