'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function deleteContest(contestId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: contest } = await cookiesClient.models.Contest.get({ contestId: contestId });

		if (!contest) {
			throw new Error('Failed to find contest when deleting contest.');
		}

		if (contest.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to delete a contest.');
		}

		const editions = (await contest.editions()).data;

		const editionPromises = editions.map(async (edition) => {
			const submissions = (await edition.submissions()).data;
			const rankings = (await edition.rankings()).data;
			const savedRankings = (await edition.savedRankings()).data;
			const televotes = (await edition.televotes()).data;
			const submissionPromises = submissions.map(async (s) => {
				await cookiesClient.models.Submission.delete({ submissionId: s.submissionId });
			});
			const rankingsPromises = rankings.map(async (s) => {
				await cookiesClient.models.Ranking.delete({ rankingId: s.rankingId });
			});
			const savedRankingsPromises = savedRankings.map(async (s) => {
				await cookiesClient.models.SavedRanking.delete({ rankingId: s.rankingId });
			});
			const televotesPromises = televotes.map(async (s) => {
				await cookiesClient.models.Televote.delete({ televoteId: s.televoteId });
			});
			const promiseResult = await Promise.all([...submissionPromises, ...rankingsPromises, ...savedRankingsPromises, ...televotesPromises]);
			console.log(promiseResult);
		});

		const promiseResult = await Promise.all(editionPromises);

		console.log(promiseResult);

		const { errors } = await cookiesClient.models.Contest.delete({
			contestId: contestId,
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to delete televote.' };
	}
}
