'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { v4 } from 'uuid';

const rankingPoints = new Map<number, number>([
	[1, 12],
	[2, 10],
	[3, 8],
	[4, 7],
	[5, 6],
	[6, 5],
	[7, 4],
	[8, 3],
	[9, 2],
	[10, 1],
]);

export async function submitVotes(rankings: string[], editionId: string) {
	const getPointsByRank = (rank: number): number | undefined => {
		return rankingPoints.get(rank);
	};

	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: submissions } = await cookiesClient.models.Submission.list({
			filter: {
				editionId: { eq: editionId },
			},
		});

		submissions.forEach(async (s) => {
			const votes = (await s.votes()).data;
			if (votes.some((v) => v.fromUserId === authUser?.userId)) {
				throw new Error('Already voted in this edition.');
			}
		});

		console.log('Your votes:', rankings);

		const votePromises = rankings.map((song, index) => {
			const newId = v4();
			return cookiesClient.models.Vote.create({
				voteId: newId,
				submissionId: song,
				points: getPointsByRank(index + 1) as number,
				fromUserId: authUser?.userId as string,
			});
		});

		const results = await Promise.all(votePromises);

		console.log(results);

		if (results.length === 0) {
			throw new Error('No votes were submitted.');
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to submit votes.' };
	}
}
