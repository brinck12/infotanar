/** Osztálynevek összefűzése; a hamis értékek kimaradnak. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
