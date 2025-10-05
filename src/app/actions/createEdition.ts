'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export async function createEdition(formData: FormData) {
	const name = formData.get('name') as string;
	const description = formData.get('description') as string;
	const contestId = formData.get('contestId') as string;
	const editionId = formData.get('editionId') as string;
	const submissionsOpen = formData.get('submissionsOpen') as string;
	const submissionDeadline = formData.get('submissionDeadline') as string;
	const votingDeadline = formData.get('votingDeadline') as string;
	const closeSubmissionType = formData.get('closeSubmissionType') as 'specificDate' | 'allEntries' | 'manually';
	const closeVotingType = formData.get('closeVotingType') as 'specificDate' | 'allEntries' | 'manually';

	try {
		const authUser = await AuthGetCurrentUserServer();

		const { data: contestData } = await cookiesClient.models.Contest.get({ contestId: contestId });

		if (contestData?.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to create an edition.');
		}

		await cookiesClient.models.Edition.create({
			editionId: editionId,
			name: name,
			description: description,
			contestId: contestId,
			submissionsOpen: submissionsOpen,
			submissionDeadline: submissionDeadline,
			votingDeadline: votingDeadline,
			closeSubmissionType: closeSubmissionType,
			closeVotingType: closeVotingType,
			phase: 'UPCOMING',
		});

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to create edition.' };
	}
}
