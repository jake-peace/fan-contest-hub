'use server';

import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export async function deleteTelevote(televoteId: string) {
	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		console.log(`Televote id is ${televoteId}`);

		const { data: televote } = await cookiesClient.models.Televote.get({ televoteId: televoteId });

		console.log(televote);

		if (!televote) {
			throw new Error('Televote not found.');
		}

		const edition = (await televote.edition()).data;

		if (!edition) {
			throw new Error('Failed to find edition when deleting televote.');
		}

		const contest = (await edition.contest()).data;

		if (!contest) {
			throw new Error('Failed to find contest when deleting televote.');
		}

		if (contest.hostId !== authUser?.userId) {
			throw new Error('You must be the contest host to delete a televote.');
		}

		const { errors } = await cookiesClient.models.Televote.delete({
			televoteId: televoteId,
		});

		if (errors) {
			throw new Error(errors[0].message);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to delete televote.' };
	}
}
