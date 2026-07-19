import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(1, 'Please provide a password'),
});

export const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().optional(),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, 'Must be a valid Egyptian phone number (e.g. 01012345678)'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  email: z.string().email('Please provide a valid email').optional(),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, 'Must be a valid Egyptian phone number (e.g. 01012345678)').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});
