'use server';

import { cookiesClient } from '@/utils/amplify-utils';

export async function createContest(formData: FormData) {
	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const contestId = formData.get('contestId') as string;
	const hostId = formData.get('hostId') as string;

	try {
		await cookiesClient.models.Contest.create({
			contestId: contestId,
			name: title,
			description: description,
			hostId: hostId,
			participants: [hostId],
		});

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to create contest' };
	}
}
