'use server';

import { cookiesClient } from '@/utils/amplify-utils';

/**
 * Generates a random alphanumeric code of a specified length.
 * Excludes characters that look similar (0/O, 1/I/l).
 */
function generateAlphanumericCode(length: number = 6): string {
	// Define the safe character set (numbers and uppercase letters, excluding confusing characters)
	const characters = '23456789ABCDEFGHJKMNPQRSTUVWXY';
	const charactersLength = characters.length;
	let result = '';

	for (let i = 0; i < length; i++) {
		// Generate a random index and append the character at that index
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

export async function createContest(formData: FormData) {
	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const contestId = formData.get('contestId') as string;
	const hostId = formData.get('hostId') as string;

	let joinCode: string;
	let unique: boolean;

	do {
		joinCode = generateAlphanumericCode();
		const existingJoinCode = await cookiesClient.models.Contest.list({
			filter: {
				joinCode: { eq: joinCode },
			},
			limit: 10000,
		});
		unique = existingJoinCode.data.length === 0;
	} while (!unique);

	try {
		await cookiesClient.models.Contest.create({
			contestId: contestId,
			name: title,
			description: description,
			hostId: hostId,
			participants: [hostId],
			joinCode: joinCode,
		});

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to create contest' };
	}
}
