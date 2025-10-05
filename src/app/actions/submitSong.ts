'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export async function submitSong(formData: FormData) {
	const submissionId = formData.get('submissionId') as string;
	const songTitle = formData.get('songTitle') as string;
	const artistName = formData.get('artistName') as string;
	const spotifyUri = formData.get('spotifyURI') as string;
	const editionId = formData.get('editionId') as string;
	const flag = formData.get('flag') as string;
	const countryName = formData.get('countryName') as string;

	try {
		const authUser = await AuthGetCurrentUserServer();

		const { data: prevCheck } = await cookiesClient.models.Submission.list({
			filter: {
				and: {
					userId: { eq: authUser?.userId },
					editionId: { eq: editionId },
					rejected: { ne: true },
				},
			},
		});

		if (prevCheck.length !== 0) {
			console.log(prevCheck);
			throw new Error(`Already submitted for this edition`);
		}

		await cookiesClient.models.Submission.create({
			submissionId: submissionId,
			userId: authUser?.userId,
			songTitle: songTitle,
			artistName: artistName,
			spotifyUri: spotifyUri,
			editionId: editionId,
			flag: flag,
			countryName: countryName,
		});

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to submit song.' };
	}
}
