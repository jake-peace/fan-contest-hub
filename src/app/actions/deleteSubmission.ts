'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function deleteSubmission(submissionId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data: submission } = await cookiesClient.models.Submission.get({ submissionId: submissionId });

		if (submission?.userId !== authUser?.userId) {
			throw new Error('You can only withdraw your own submission.');
		}

		const { errors } = await cookiesClient.models.Submission.delete({
			submissionId: submissionId,
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to delete submission.' };
	}
}
