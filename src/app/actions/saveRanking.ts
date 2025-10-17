'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { v4 } from 'uuid';

export async function saveRanking(rankings: string[], editionId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: existingRanking } = await cookiesClient.models.SavedRanking.list({
			filter: {
				and: [
					{
						editionId: { eq: editionId },
					},
					{
						userId: { eq: authUser?.userId },
					},
				],
			},
		});

		console.log(`Attempting to save rankings for ${authUser?.userId} in edition ${editionId}: ${JSON.stringify(rankings)}`);

		if (existingRanking) {
			const { errors } = await cookiesClient.models.SavedRanking.update({
				rankingId: existingRanking[0].rankingId,
				rankingList: rankings,
			});
			if (errors) {
				throw new Error('Error when trying update a saved ranking.');
			}
		} else {
			const { errors } = await cookiesClient.models.SavedRanking.create({
				rankingId: v4(),
				userId: authUser?.userId,
				rankingList: rankings,
				editionId: editionId,
			});
			if (errors) {
				throw new Error(`Unknown error when trying to create a saved ranking for ${authUser?.userId} in edition ${editionId}`);
			}
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to save votes.' };
	}
}
