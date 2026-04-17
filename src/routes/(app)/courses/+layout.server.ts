import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const p = await parent();
	return {
		hasProAccess: p.entitlementKeys.includes(`pro_access`),
	};
};
