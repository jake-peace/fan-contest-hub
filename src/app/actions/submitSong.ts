'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function submitSong(formData: FormData) {
	const submissionId = formData.get('submissionId') as string;
	const songTitle = formData.get('songTitle') as string;
	const artistName = formData.get('artistName') as string;
	const spotifyUri = formData.get('spotifyURI') as string;
	const editionId = formData.get('editionId') as string;
	const flag = formData.get('flag') as string;
	const countryName = formData.get('countryName') as string;

	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

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

		const { data } = await cookiesClient.models.Submission.create({
			submissionId: submissionId,
			userId: authUser?.userId,
			songTitle: songTitle,
			artistName: artistName,
			spotifyUri: spotifyUri,
			editionId: editionId,
			flag: flag,
			countryName: countryName,
		});

		if (!data) {
			throw new Error('Failed to submit song.');
		}

		const edition = (await data.edition()).data;
		const contest = (await edition?.contest())?.data;
		const editionSubmissions = (await edition?.submissions())?.data;

		if (!editionSubmissions) {
			throw new Error('Failed to get other submissions');
		}

		if (contest?.participants?.length === editionSubmissions.length && edition?.closeSubmissionType === 'allEntries') {
			await cookiesClient.models.Edition.update({
				editionId: editionId,
				phase: 'VOTING',
			});
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to submit song.' };
	}
}
