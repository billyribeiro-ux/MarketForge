import * as z from 'zod';

export const loginFormSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
	redirectTo: z.string().optional(),
});

export const signupFormSchema = z.object({
	name: z.string().min(1).max(120),
	email: z.email(),
	password: z.string().min(8).max(200),
});

export const requestResetFormSchema = z.object({
	email: z.email(),
});

export const resetPasswordFormSchema = z.object({
	token: z.string().min(1),
	newPassword: z.string().min(8).max(200),
});
