'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export async function deleteSubmission(submissionId: string) {
	try {
		const authUser = await AuthGetCurrentUserServer();

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
