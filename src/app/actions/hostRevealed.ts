'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function hostRevealed(editionId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		if (!edition) {
			throw new Error('Failed to find edition.');
		}

		const contest = (await edition.contest()).data;

		if (contest?.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to mark the results as revealed.');
		}

		const { errors } = await cookiesClient.models.Edition.update({
			editionId: editionId,
			resultsRevealed: true,
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to mark results as revealed.' };
	}
}
