import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
})

export const intakeSubmissionSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
    email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
    phone: z.string().max(50).optional(),
    contactPreference: z.string().max(100).optional(),
    moveInDate: z.string().optional(),
    budgetMin: z.union([z.number(), z.string()]).optional(),
    budgetMax: z.union([z.number(), z.string()]).optional(),
    vibes: z.array(z.string()).optional(),
    intakeRef: z.string().max(200).optional(),
  })
  .refine(
    (data) => (data.email && String(data.email).trim().length > 0) || (data.phone && String(data.phone).trim().length > 0),
    { message: 'Email or phone is required', path: ['email'] }
  )
