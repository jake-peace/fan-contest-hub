'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function editContest(formData: FormData) {
	const currentRequestCookies = cookies;
	const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const contestId = formData.get('contestId') as string;

	const { data } = await cookiesClient.models.Contest.get({ contestId: contestId });

	if (!data) {
		throw new Error('Failed to find contest when updating contest details');
	}

	if (data.hostId !== authUser?.userId) {
		throw new Error('You must be the host to update contest details');
	}

	try {
		await cookiesClient.models.Contest.update({
			contestId: contestId,
			name: title,
			description: description,
		});

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to create contest' };
	}
}
