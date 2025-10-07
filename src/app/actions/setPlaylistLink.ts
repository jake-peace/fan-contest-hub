'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';

export async function setPlaylistLink(editionId: string, link: string) {
	try {
		const authUser = await AuthGetCurrentUserServer();

		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });

		if (!edition) {
			throw new Error('Failed to find edition.');
		}

		const contest = (await edition.contest()).data;

		if (contest?.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to set the playlist link.');
		}

		const { errors } = await cookiesClient.models.Edition.update({
			editionId: editionId,
			spotifyPlaylistLink: link,
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to set playlist link.' };
	}
}
