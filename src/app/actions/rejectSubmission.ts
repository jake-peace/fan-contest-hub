'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export async function rejectSubmission(submissionId: string, contestId: string) {
	try {
		const authUser = await AuthGetCurrentUserServer();

		const { data: contest } = await cookiesClient.models.Contest.get({ contestId: contestId });

		if (contest?.hostId !== authUser?.userId) {
			throw new Error(
				`You must be the contest host to reject a submission. You are ${authUser?.userId} and the host is ${contest?.hostId}`
			);
		}

		const { errors } = await cookiesClient.models.Submission.update({
			submissionId: submissionId,
			rejected: true,
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to reject submission.' };
	}
}
