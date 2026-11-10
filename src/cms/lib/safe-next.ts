/** Post-login redirect target: same-app admin paths only; anything else goes to the dashboard. */
export function safeNext(next: string | null | undefined) {
  return next && /^\/admin(\/[\w\-./?=&%]*)?$/.test(next) && !next.includes('..') ? next : '/admin/dashboard'
}
