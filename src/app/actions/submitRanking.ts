'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { v4 } from 'uuid';

// const rankingPoints = new Map<number, number>([
// 	[1, 12],
// 	[2, 10],
// 	[3, 8],
// 	[4, 7],
// 	[5, 6],
// 	[6, 5],
// 	[7, 4],
// 	[8, 3],
// 	[9, 2],
// 	[10, 1],
// ]);

export async function submitRanking(rankings: string[], editionId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: existingRanking } = await cookiesClient.models.Ranking.list({
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

		if (existingRanking.length > 0) {
			throw new Error(`User ${authUser?.username} has already submitted a ranking for edition ${editionId}`);
		}

		console.log(`Attempting to submit rankings for ${authUser?.userId} in edition ${editionId}: ${JSON.stringify(rankings)}`);

		const { errors } = await cookiesClient.models.Ranking.create({
			rankingId: v4(),
			userId: authUser?.userId,
			rankingList: rankings,
			editionId: editionId,
		});

		if (errors) {
			throw new Error(`Unknown error when trying to submit ranking for ${authUser?.userId} in edition ${editionId}`);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to submit votes.' };
	}
}
