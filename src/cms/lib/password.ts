import bcrypt from 'bcryptjs'
import { z } from 'zod'

// bcryptjs is pure JS; cost 12 keeps a hash around 250 ms without stalling the event loop for long.
const COST = 12

export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(200, 'Password is too long')

export const hashPassword = (password: string) => bcrypt.hash(password, COST)

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash)

// Compared against when the email is unknown so response time does not reveal which accounts exist.
let dummyHash: Promise<string> | undefined
export const dummyPasswordHash = () => (dummyHash ??= bcrypt.hash('not-a-real-password', COST))
