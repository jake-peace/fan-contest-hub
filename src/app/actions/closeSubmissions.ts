'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export async function closeSubmissions(editionId: string) {
	try {
		const authUser = await AuthGetCurrentUserServer();

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		const contest = await edition?.contest();

		if (contest?.data?.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to close submissions.');
		}

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
