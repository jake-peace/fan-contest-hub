'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export async function joinContestWithCode(joinCode: string) {
	try {
		const authUser = await AuthGetCurrentUserServer();

		if (!authUser) {
			throw new Error('You must be logged in to join a contest.');
		}

		const { data: contest } = await cookiesClient.models.Contest.list({
			filter: {
				joinCode: { eq: joinCode },
			},
		});

		if (contest.length !== 1) {
			throw new Error('Invalid join code');
		}

		if (contest[0].participants?.includes(authUser.userId)) {
			throw new Error('Contest already joined');
		}

		const newParticipants = [...(contest[0].participants ?? []), authUser.userId];

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
