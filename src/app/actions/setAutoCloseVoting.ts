'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function setAutoCloseVoting(editionId: string, autoClose: boolean) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		if (!edition) {
			throw new Error('Failed to find edition.');
		}

		const contest = (await edition.contest()).data;

		if (contest?.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to set the playlist closing type.');
		}

		const { errors } = await cookiesClient.models.Edition.update({
			editionId: editionId,
			closeVotingType: autoClose ? 'specificDate' : 'manually',
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true, date: edition.votingDeadline };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to set playlist link.' };
	}
}
