import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const p = await parent();
	return {
		hasLiveRoom: p.entitlementKeys.includes(`live_room`),
	};
};
