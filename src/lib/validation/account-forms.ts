import * as z from 'zod';

export const profileFormSchema = z.object({
	name: z.string().min(1).max(120),
});

export const deleteAccountFormSchema = z.object({
	password: z.string().min(1),
	confirm: z.literal(`DELETE`, {
		message: `Type DELETE exactly to confirm`,
	}),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountFormSchema>;
