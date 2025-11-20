'use server';

import { SubmissionWithScore } from '@/components/ResultsComponent';
import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { Schema } from '../../../amplify/data/resource';

type Ranking = Schema['Ranking']['type'];

const rankingPoints = new Map<number, number>([
	[-1, 0],
	[0, 12],
	[1, 10],
	[2, 8],
	[3, 7],
	[4, 6],
	[5, 5],
	[6, 4],
	[7, 3],
	[8, 2],
	[9, 1],
]);

export async function closeVoting(editionId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		if (!edition) {
			throw new Error('Failed to find edition.');
		}

		const contest = await edition?.contest();

		if (contest?.data?.hostId !== authUser?.userId) {
			throw new Error('You must be the host to close voting.');
		}

		const { errors } = await cookiesClient.models.Edition.update({
			editionId: editionId,
			phase: 'RESULTS',
		});

		// get all non rejected submissions
		const { data: submissionData } = await cookiesClient.models.Submission.list({
			filter: {
				editionId: { eq: editionId },
				rejected: { eq: false },
			},
			limit: 10000,
		});

		if (!submissionData) {
			throw new Error('Cannot close voting when there are no songs to vote for.');
		}

		// get all rankings
		const rankingData = (await edition.rankings({ limit: 10000 })).data;

		// get all televotes
		const televoteData = (await edition.televotes({ limit: 10000 })).data;

		// todo: any rankingData without a submission needs moving to televoteData

		// let rankingsToMove: Ranking[] = [];

		// rankingData.forEach((r) => {
		//     if (!submissionData.some((s) => s.userId === r.userId)) {
		//         // has ranking but not present in submission data
		//         rankingsToMove = [...rankingsToMove, r];
		//     }
		// })

		// only bother with operation if there are any to move
		// if (rankingsToMove.length > 0) {
		//     await Promise.all(
		//         rankingsToMove.map(async (r) => {
		//             await cookiesClient.models.Televote.create({
		//                 editionId: editionId,
		//                 rankingList: r.rankingList,
		//                 guestName: 'Anonymous Televoter',
		//                 televoteId: r.rankingId,
		//             });

		//         })
		//     )
		// }

		// calculate score for all submissions
		let submissionsWithScores: SubmissionWithScore[] = [];

		submissionData.forEach((s) => {
			const counts = new Array<number>(10).fill(0);

			// Iterate over every inner array in the external data
			for (const innerArray of rankingData.map((r) => r.rankingList as string[]) as string[][]) {
				// Check the first 10 positions (index 0 to 9) of the current inner array
				const limit = Math.min(innerArray.length, 10);

				for (let i = 0; i < limit; i++) {
					if (innerArray[i] === s.submissionId) {
						// Increment the count for that specific index (i)
						counts[i]++;
					}
				}
			}

			for (const innerArray of televoteData.map((r) => r.rankingList as string[]) as string[][]) {
				// Check the first 10 positions (index 0 to 9) of the current inner array
				const limit = Math.min(innerArray.length, 10);

				for (let i = 0; i < limit; i++) {
					if (innerArray[i] === s.submissionId) {
						// Increment the count for that specific index (i)
						counts[i]++;
					}
				}
			}

			let score = 0;
			counts.forEach((c, index) => {
				if (c !== 0) {
					score = score + c * (rankingPoints.get(index) as number);
				}
			});

			submissionsWithScores = [...submissionsWithScores, { ...s, score: score }];
		});

		// order submissions by score
		const orderedSubmissions = [...submissionsWithScores].sort((a, b) => b.score - a.score);

		// ranking is index + 1
		let submissionsWithRanks: SubmissionWithScore[] = [];

		orderedSubmissions.forEach((s, index) => {
			submissionsWithRanks = [...submissionsWithRanks, { ...s, rank: index + 1 }];
		});

		await Promise.all(
			orderedSubmissions.map(async (s) => {
				await cookiesClient.models.Submission.update({
					submissionId: s.submissionId,
					rank: s.rank,
				});
			})
		);

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to close voting.' };
	}
}
