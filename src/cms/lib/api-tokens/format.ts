// Shape of a personal API token: `ncms_` + 43 base64url characters (256 random bits). The prefix
// makes leaked tokens easy to spot (grep, GitHub secret-scanning custom pattern).
export const TOKEN_PREFIX = 'ncms_'
export const TOKEN_RE = /^ncms_[A-Za-z0-9_-]{43}$/
export const BEARER_RE = /^Bearer (ncms_[A-Za-z0-9_-]{43})$/
// Anything that looks like it is trying to be one of ours, valid or not.
export const LOOKS_LIKE_TOKEN = /^Bearer\s+ncms_/i

export const TOKEN_EXPIRY_DAYS = [7, 30, 60, 90] as const
export const MAX_ACTIVE_TOKENS = 5
/** Shown in lists so people can tell tokens apart without the secret. */
export const tokenPrefix = (token: string) => token.slice(0, 12)
