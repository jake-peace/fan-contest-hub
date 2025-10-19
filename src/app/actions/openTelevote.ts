'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { v4 } from 'uuid';

export async function openTelevote(editionId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		if (!authUser) {
			throw new Error('You must be logged in to join a contest.');
		}

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		if (!edition) {
			throw new Error('Failed to find edition.');
		}

		const contest = (await edition.contest()).data;

		if (!contest) {
			throw new Error('Failed to find contest.');
		}

		if (contest.hostId !== authUser.userId) {
			throw new Error('You must be the contest host to open a televote.');
		}

		const { errors } = await cookiesClient.models.Edition.update({
			editionId: editionId,
			televoteId: v4(),
		});

		if (errors) {
			throw new Error('Server action failed.');
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error };
	}
}
