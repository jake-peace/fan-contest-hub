'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export async function openSubmissions(editionId: string) {
	try {
		const authUser = await AuthGetCurrentUserServer();

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		const contest = await edition?.contest();

		if (contest?.data?.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to open submissions.');
		}

		if (!edition || !contest) {
			throw new Error('Contest or edition not found');
		}

		const { errors } = await cookiesClient.models.Edition.update({
			editionId: editionId,
			phase: 'SUBMISSION',
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to open submissions.' };
	}
}
