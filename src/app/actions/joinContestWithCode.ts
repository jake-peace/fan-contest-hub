'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function joinContestWithCode(joinCode: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		if (!authUser) {
			throw new Error('You must be logged in to join a contest.');
		}

		const { data: contest } = await cookiesClient.models.Contest.list({
			filter: {
				joinCode: { eq: joinCode },
			},
			limit: 10000,
		});

		if (contest.length !== 1) {
			throw new Error('Invalid join code');
		}

		if (contest[0].participants?.includes(authUser.userId)) {
			throw new Error('Contest already joined');
		}

		const newParticipants = [...(contest[0].participants as string[]), authUser.userId];

		const { errors } = await cookiesClient.models.Contest.update({
			contestId: contest[0].contestId,
			participants: newParticipants,
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true, contest: contest[0].name };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error };
	}
}
