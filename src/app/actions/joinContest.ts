'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function joinContest(joinCode: string, contestId?: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		if (!authUser) {
			throw new Error('You must be logged in to join a contest.');
		}

		const { data: contest } = await cookiesClient.models.Contest.get({ contestId: contestId });

		if (!contest) {
			throw new Error('Failed to find contest.');
		}

		if (contest.joinCode !== joinCode) {
			throw new Error('Incorrect join code given');
		}

		if (contest.participants?.includes(authUser.userId)) {
			throw new Error('User already in contest');
		}

		const newParticipants = [...(contest.participants as string[]), authUser.userId];

		const { errors } = await cookiesClient.models.Contest.update({
			contestId: contestId,
			participants: newParticipants,
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error };
	}
}
