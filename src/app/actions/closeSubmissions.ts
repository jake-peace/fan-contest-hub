'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

function shuffleArray<T>(array: T[]): T[] {
	// 1. Create a shallow copy of the array so the original is not modified.
	const newArray = [...array];

	let currentIndex = newArray.length;
	let randomIndex;

	// 2. While there remain elements to shuffle.
	while (currentIndex !== 0) {
		// 3. Pick a remaining element.
		// The cast 'as number' is often needed in TypeScript environments
		// because Math.floor returns a number, but some linting rules are strict.
		randomIndex = Math.floor(Math.random() * currentIndex) as number;
		currentIndex--;

		// 4. And swap it with the current element.
		[newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
	}

	return newArray;
}

export async function closeSubmissions(editionId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		const contest = await edition?.contest();

		if (contest?.data?.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to close submissions.');
		}

		// assign running orders
		// 		const votePromises = rankings.map((song, index) => {
		// 	const newId = v4();
		// 	return cookiesClient.models.Vote.create({
		// 		voteId: newId,
		// 		submissionId: song,
		// 		points: getPointsByRank(index + 1) as number,
		// 		fromUserId: authUser?.userId as string,
		// 	});
		// });

		// const results = await Promise.all(votePromises);

		const { data: submissions } = await cookiesClient.models.Submission.list({
			filter: {
				editionId: { eq: editionId },
			},
		});

		if (!submissions || !edition || !contest) {
			throw new Error('No submissions in contest or edition not found');
		}

		if (submissions.length > (contest.data?.participants?.length || 0)) {
			throw new Error('More submissions than participants. Seek help.');
		}

		const promises = shuffleArray(submissions).map((s, index) => {
			return cookiesClient.models.Submission.update({
				submissionId: s.submissionId,
				runningOrder: index + 1,
			});
		});

		await Promise.all(promises);

		const { errors } = await cookiesClient.models.Edition.update({
			editionId: editionId,
			phase: 'VOTING',
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to close submissions.' };
	}
}
