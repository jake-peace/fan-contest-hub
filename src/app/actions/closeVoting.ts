'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function closeVoting(editionId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		const contest = await edition?.contest();

		if (contest?.data?.hostId !== authUser?.userId) {
			throw new Error('You must be the host to close voting.');
		}

		const { errors } = await cookiesClient.models.Edition.update({
			editionId: editionId,
			phase: 'RESULTS',
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to close voting.' };
	}
}
