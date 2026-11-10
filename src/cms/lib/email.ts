import 'server-only'
import { Resend } from 'resend'
import { escapeHtml } from './sanitize'

let client: Resend | null | undefined
const resend = () => (client ??= process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null)

const FROM = () => process.env.CMS_EMAIL_FROM || 'NEAR CMS <cms@nearinternal.space>'

/** Absolute origin for links in emails. Never derived from request headers. */
export function cmsOrigin() {
  const origin = process.env.CMS_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
  if (!origin) throw new Error('CMS_ORIGIN must be set in production (e.g. https://www.near.org)')
  return origin.replace(/\/$/, '')
}

export async function sendEmail(to: string | string[], subject: string, html: string) {
  const r = resend()
  if (!r) {
    // Local dev without a key: log instead of failing the flow.
    console.warn(`[cms] RESEND_API_KEY missing; email "${subject}" to ${String(to)} not sent`)
    return { ok: false as const }
  }
  const { error } = await r.emails.send({ from: FROM(), to, subject, html })
  if (error) {
    console.error('[cms] email failed', subject, error)
    return { ok: false as const }
  }
  return { ok: true as const }
}

const layout = (body: string) =>
  `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:520px">${body}<p style="color:#666;font-size:13px;margin-top:32px">NEAR CMS</p></div>`

const button = (href: string, label: string) =>
  `<p><a href="${escapeHtml(href)}" style="display:inline-block;background:#00EC97;color:#000;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">${escapeHtml(label)}</a></p>`

export const inviteEmail = (name: string, inviter: string, link: string) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(inviter)} invited you to the NEAR CMS. Confirm this is your address and choose a password to create your account.</p>${button(link, 'Confirm and create account')}<p>This link expires in 48 hours. If you were not expecting it, ignore this email.</p>`,
  )

export const verifyEmail = (name: string, link: string) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>Confirm your email address to activate your NEAR CMS account.</p>${button(link, 'Confirm email')}<p>This link expires in 24 hours. If you did not try to sign in, ignore this email and tell an admin.</p>`,
  )

const when = (date: Date) => `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`

export const apiTokenCreatedEmail = (name: string, tokenName: string, ip: string | null, expiresAt: Date, link: string) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>A new API token named <strong>${escapeHtml(tokenName)}</strong> was created for your NEAR CMS account${ip ? ` from ${escapeHtml(ip)}` : ''}. It expires on ${when(expiresAt)}.</p><p>If this was not you, revoke it now and tell an admin.</p>${button(link, 'Review your tokens')}`,
  )

export const apiTokenRevokedEmail = (name: string, tokenName: string, by: string, link: string) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(by)} revoked your API token <strong>${escapeHtml(tokenName)}</strong>. Anything using it (for example Claude Code) stops working; create a new token if you still need one.</p>${button(link, 'Review your tokens')}`,
  )

export const postScheduledByTokenEmail = (name: string, title: string, publishAt: Date, editLink: string, previewLink: string) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>Your API token scheduled <strong>${escapeHtml(title)}</strong> to go live on ${when(publishAt)}. It has not been through the editor: review it before then.</p>${button(previewLink, 'Preview')}<p>To change or cancel it, <a href="${escapeHtml(editLink)}">open it in the editor</a>.</p>`,
  )

export const postPublishedByTokenEmail = (name: string, title: string, publicLink: string, editLink: string) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>Your API token published <strong>${escapeHtml(title)}</strong>. It is live now.</p>${button(publicLink, 'View the post')}<p>To change it, take it down or restore an earlier version, <a href="${escapeHtml(editLink)}">open it in the editor</a>.</p>`,
  )

export const accountUnderAttackEmail = (name: string, failures: number, resetLink: string) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>Someone has tried to sign in to your NEAR CMS account with a wrong password ${failures} times in the last few minutes, possibly from many places at once.</p><p>Your account has not been locked, and nobody got in. If these were not your attempts, make sure your password is long and not used anywhere else. To change it now:</p>${button(resetLink, 'Choose a new password')}<p>You will get at most one of these emails a day.</p>`,
  )

export const passwordChangedEmail = (name: string, ip: string | null, at: Date) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>The password for your NEAR CMS account was changed on ${when(at)}${ip ? ` from ${escapeHtml(ip)}` : ''}. Every session and API token on the account was signed out.</p><p>If this was not you, tell an admin right away.</p>`,
  )

export const newSignInEmail = (name: string, ip: string, userAgent: string | null, at: Date) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>Your NEAR CMS account was signed in on ${when(at)} from an IP address it has not used before: <strong>${escapeHtml(ip)}</strong>${userAgent ? ` (${escapeHtml(userAgent.slice(0, 120))})` : ''}.</p><p>If this was you, there is nothing to do. If not, reset your password and tell an admin.</p>`,
  )

export const adminResetRequestedEmail = (adminEmail: string, ip: string | null, at: Date, auditLink: string) =>
  layout(
    `<p>A password reset was requested on ${when(at)} for the admin account <strong>${escapeHtml(adminEmail)}</strong>${ip ? ` from ${escapeHtml(ip)}` : ''}.</p><p>The link only went to that address. If its owner did not ask for it, someone may be targeting the account.</p>${button(auditLink, 'Open the audit log')}`,
  )

export const signInSpikeEmail = (failures: number, windowMinutes: number, auditLink: string) =>
  layout(
    `<p>The NEAR CMS has had more than ${failures} failed sign-ins in the last ${windowMinutes} minutes. This usually means someone is guessing passwords.</p><p>Accounts are not locked; attempts are slowed down per address and per IP. Check the audit log for the addresses being targeted.</p>${button(auditLink, 'Open the audit log')}<p>You will get at most one of these emails an hour.</p>`,
  )

export const resetEmail = (name: string, link: string) =>
  layout(
    `<p>Hi ${escapeHtml(name)},</p><p>Someone asked to reset your NEAR CMS password. If it was not you, ignore this email.</p>${button(link, 'Choose a new password')}<p>This link expires in 1 hour.</p>`,
  )
