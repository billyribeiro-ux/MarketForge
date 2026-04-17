import { relations, sql as sqlRaw } from 'drizzle-orm';
import {
	bigint,
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';

/** Matches Stripe subscription statuses we persist locally. */
export const subscriptionStatusEnum = pgEnum('subscription_status', [
	'active',
	'canceled',
	'incomplete',
	'incomplete_expired',
	'past_due',
	'trialing',
	'unpaid',
	'paused',
]);

/** Canonical entitlement keys — always read from `entitlements`, never from `users`. */
export const entitlementKeyEnum = pgEnum('entitlement_key', [
	'pro_access',
	'indicator_vault',
	'live_room',
	'admin',
]);

export const productKindEnum = pgEnum('product_kind', [
	'subscription',
	'one_time',
]);

export const entitlementSourceEnum = pgEnum('entitlement_source', [
	'subscription',
	'purchase',
	'manual',
]);

// ——— Better Auth (plural tables + `usePlural` + verification map in auth config) ———

export const users = pgTable(
	'users',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		email: text('email').notNull(),
		emailVerified: boolean('email_verified').notNull().default(false),
		image: text('image'),
		twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
		/** Application-level ban (e.g. dev persona). Not part of Better Auth core. */
		banned: boolean('banned').notNull().default(false),
		stripeCustomerId: text('stripe_customer_id'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex('users_email_unique').on(t.email)],
);

export const sessions = pgTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		token: text('token').notNull(),
		expiresAt: timestamp('expires_at', {
			withTimezone: true,
			mode: 'date',
		}).notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		uniqueIndex('sessions_token_unique').on(t.token),
		index('sessions_user_id_idx').on(t.userId),
	],
);

export const accounts = pgTable(
	'accounts',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', {
			withTimezone: true,
			mode: 'date',
		}),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
			withTimezone: true,
			mode: 'date',
		}),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index('accounts_user_id_idx').on(t.userId),
		uniqueIndex('accounts_provider_account_unique').on(
			t.providerId,
			t.accountId,
		),
	],
);

/** Better Auth `verification` model; table name per project contract (`verification_tokens`). */
export const verificationTokens = pgTable(
	'verification_tokens',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', {
			withTimezone: true,
			mode: 'date',
		}).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [index('verification_tokens_identifier_idx').on(t.identifier)],
);

/** Better Auth two-factor plugin (`twoFactor` model → `two_factors` with `usePlural`). */
export const twoFactors = pgTable(
	'two_factors',
	{
		id: text('id').primaryKey(),
		secret: text('secret').notNull(),
		backupCodes: text('backup_codes').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		verified: boolean('verified').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex('two_factors_user_id_unique').on(t.userId)],
);

/** Better Auth `@better-auth/passkey` model. */
export const passkeys = pgTable(
	'passkeys',
	{
		id: text('id').primaryKey(),
		name: text('name'),
		publicKey: text('public_key').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		credentialID: text('credential_id').notNull(),
		counter: bigint('counter', { mode: 'number' }).notNull(),
		deviceType: text('device_type').notNull(),
		backedUp: boolean('backed_up').notNull(),
		transports: text('transports'),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'date',
		}).defaultNow(),
		aaguid: text('aaguid'),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index('passkeys_user_id_idx').on(t.userId),
		index('passkeys_credential_id_idx').on(t.credentialID),
	],
);

// ——— Billing & entitlements ———

export const products = pgTable(
	'products',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		slug: text('slug').notNull(),
		name: text('name').notNull(),
		kind: productKindEnum('kind').notNull(),
		stripeProductId: text('stripe_product_id'),
		active: boolean('active').notNull().default(true),
		metadata: jsonb('metadata').$type<Record<string, unknown>>(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex('products_slug_unique').on(t.slug)],
);

export const prices = pgTable(
	'prices',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		productId: uuid('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		stripePriceId: text('stripe_price_id'),
		/** ISO currency, lower-case (e.g. `usd`). */
		currency: text('currency').notNull().default('usd'),
		/** Amount in smallest currency unit (e.g. cents). */
		unitAmount: integer('unit_amount').notNull(),
		/** `month`, `year`, or null for one-time prices. */
		recurringInterval: text('recurring_interval'),
		recurringIntervalCount: integer('recurring_interval_count')
			.notNull()
			.default(1),
		active: boolean('active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [index('prices_product_id_idx').on(t.productId)],
);

export const coupons = pgTable(
	'coupons',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		code: text('code').notNull(),
		stripeCouponId: text('stripe_coupon_id'),
		name: text('name'),
		percentOff: integer('percent_off'),
		amountOff: integer('amount_off'),
		currency: text('currency'),
		active: boolean('active').notNull().default(true),
		metadata: jsonb('metadata').$type<Record<string, unknown>>(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex('coupons_code_unique').on(t.code)],
);

export const subscriptions = pgTable(
	'subscriptions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		priceId: uuid('price_id').references(() => prices.id, {
			onDelete: 'set null',
		}),
		stripeCustomerId: text('stripe_customer_id').notNull(),
		stripeSubscriptionId: text('stripe_subscription_id').notNull(),
		status: subscriptionStatusEnum('status').notNull(),
		cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
		currentPeriodStart: timestamp('current_period_start', {
			withTimezone: true,
			mode: 'date',
		}),
		currentPeriodEnd: timestamp('current_period_end', {
			withTimezone: true,
			mode: 'date',
		}),
		trialStart: timestamp('trial_start', { withTimezone: true, mode: 'date' }),
		trialEnd: timestamp('trial_end', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		uniqueIndex('subscriptions_stripe_subscription_id_unique').on(
			t.stripeSubscriptionId,
		),
		index('subscriptions_user_id_idx').on(t.userId),
	],
);

export const purchases = pgTable(
	'purchases',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		productId: uuid('product_id').references(() => products.id, {
			onDelete: 'set null',
		}),
		stripeCheckoutSessionId: text('stripe_checkout_session_id'),
		stripePaymentIntentId: text('stripe_payment_intent_id'),
		amount: integer('amount').notNull(),
		currency: text('currency').notNull().default('usd'),
		status: text('status').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [index('purchases_user_id_idx').on(t.userId)],
);

export const entitlements = pgTable(
	'entitlements',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		key: entitlementKeyEnum('key').notNull(),
		source: entitlementSourceEnum('source').notNull(),
		/** Stripe subscription id, checkout session id, or internal reference depending on `source`. */
		sourceRef: text('source_ref'),
		validFrom: timestamp('valid_from', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		validUntil: timestamp('valid_until', { withTimezone: true, mode: 'date' }),
		revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
		metadata: jsonb('metadata').$type<Record<string, unknown>>(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index('entitlements_user_id_idx').on(t.userId),
		index('entitlements_key_idx').on(t.key),
	],
);

export const webhookEvents = pgTable(
	'webhook_events',
	{
		stripeEventId: text('stripe_event_id').primaryKey(),
		type: text('type').notNull(),
		receivedAt: timestamp('received_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		processedAt: timestamp('processed_at', {
			withTimezone: true,
			mode: 'date',
		}),
		payload: jsonb('payload').$type<Record<string, unknown>>(),
	},
	(t) => [index('webhook_events_type_idx').on(t.type)],
);

export const outboxStatusEnum = pgEnum('outbox_status', [
	'pending',
	'sent',
	'dead',
]);

/**
 * Durable outbox for side-effects that must survive webhook transactions
 * (primarily transactional email). Rows are written inside the business
 * transaction; a dispatcher drains them on a timer and via the `/api/cron`
 * endpoint for serverless targets.
 */
export type EmailOutboxPayload = {
	to: string;
	subject: string;
	html: string;
	replyTo?: string;
};

export const emailOutbox = pgTable(
	'email_outbox',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		kind: text('kind').notNull(),
		payload: jsonb('payload').$type<EmailOutboxPayload>().notNull(),
		status: outboxStatusEnum('status').notNull().default('pending'),
		attempts: integer('attempts').notNull().default(0),
		maxAttempts: integer('max_attempts').notNull().default(5),
		nextAttemptAt: timestamp('next_attempt_at', {
			withTimezone: true,
			mode: 'date',
		})
			.notNull()
			.defaultNow(),
		lastError: text('last_error'),
		sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index('email_outbox_drain_idx')
			.on(t.nextAttemptAt)
			.where(sqlRaw`status = 'pending'`),
	],
);

export const auditLog = pgTable(
	'audit_log',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		actorUserId: text('actor_user_id').references(() => users.id, {
			onDelete: 'set null',
		}),
		action: text('action').notNull(),
		entityType: text('entity_type').notNull(),
		entityId: text('entity_id').notNull(),
		metadata: jsonb('metadata').$type<Record<string, unknown>>(),
		ipAddress: text('ip_address'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [index('audit_log_entity_idx').on(t.entityType, t.entityId)],
);

// ——— Product content ———

export const courses = pgTable(
	'courses',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		description: text('description'),
		sortOrder: integer('sort_order').notNull().default(0),
		published: boolean('published').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex('courses_slug_unique').on(t.slug)],
);

export const courseProgress = pgTable(
	'course_progress',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		lessonSlug: text('lesson_slug').notNull(),
		completedAt: timestamp('completed_at', {
			withTimezone: true,
			mode: 'date',
		}),
		progressPercent: integer('progress_percent').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		uniqueIndex('course_progress_user_course_lesson_unique').on(
			t.userId,
			t.courseId,
			t.lessonSlug,
		),
	],
);

export const indicators = pgTable(
	'indicators',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		description: text('description'),
		pineStorageKey: text('pine_storage_key'),
		thinkscriptStorageKey: text('thinkscript_storage_key'),
		sortOrder: integer('sort_order').notNull().default(0),
		published: boolean('published').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex('indicators_slug_unique').on(t.slug)],
);

// ——— Relations (Better Auth joins / app queries) ———

export const usersRelations = relations(users, ({ many, one }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	twoFactor: one(twoFactors),
	passkeys: many(passkeys),
	subscriptions: many(subscriptions),
	purchases: many(purchases),
	entitlements: many(entitlements),
	courseProgress: many(courseProgress),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const twoFactorsRelations = relations(twoFactors, ({ one }) => ({
	user: one(users, { fields: [twoFactors.userId], references: [users.id] }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
	user: one(users, { fields: [passkeys.userId], references: [users.id] }),
}));

export const productsRelations = relations(products, ({ many }) => ({
	prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
	product: one(products, {
		fields: [prices.productId],
		references: [products.id],
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
	price: one(prices, {
		fields: [subscriptions.priceId],
		references: [prices.id],
	}),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
	user: one(users, { fields: [purchases.userId], references: [users.id] }),
	product: one(products, {
		fields: [purchases.productId],
		references: [products.id],
	}),
}));

export const entitlementsRelations = relations(entitlements, ({ one }) => ({
	user: one(users, { fields: [entitlements.userId], references: [users.id] }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
	progress: many(courseProgress),
}));

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
	user: one(users, { fields: [courseProgress.userId], references: [users.id] }),
	course: one(courses, {
		fields: [courseProgress.courseId],
		references: [courses.id],
	}),
}));

/**
 * Drizzle tables keyed by Better Auth model names (`user`, `session`, …).
 * Pass as `schema` into `drizzleAdapter`.
 */
export const betterAuthAdapterSchema = {
	user: users,
	session: sessions,
	account: accounts,
	verification: verificationTokens,
	twoFactor: twoFactors,
	passkey: passkeys,
};
