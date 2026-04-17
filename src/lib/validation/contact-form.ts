import * as z from 'zod';

export const contactTopicSchema = z.enum([
	`general`,
	`billing`,
	`technical`,
	`partnership`,
]);

/**
 * `website`: invisible honeypot (bots fill every input; humans leave it blank).
 * `formLoadedAt`: epoch ms written by the page on mount; a submit less than
 * MIN_DWELL_MS after load is treated as automated.
 *
 * Both fields are optional in the schema so we can log-and-discard bot hits
 * without returning a validation-error shape that hints at the check.
 */
export const contactFormSchema = z.object({
	name: z.string().min(1).max(120),
	email: z.email(),
	topic: contactTopicSchema,
	message: z.string().min(20).max(8000),
	website: z.string().max(0).optional().default(``),
	formLoadedAt: z.coerce.number().int().nonnegative().optional(),
});

export const CONTACT_MIN_DWELL_MS = 1500;

export type ContactFormData = z.infer<typeof contactFormSchema>;
