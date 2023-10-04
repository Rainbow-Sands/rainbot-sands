import { recappers } from '$lib/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		recapper: recappers[0]
	};
};
