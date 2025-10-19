'use server';

import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';
import { v4 } from 'uuid';

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

export async function submitTelevote(rankings: string[], editionId: string, name: string) {
	try {
		const { errors } = await client.models.Televote.create({
			televoteId: v4(),
			rankingList: rankings,
			guestName: name,
			editionId: editionId,
		});

		if (errors) {
			throw new Error(`Unknown error when trying to submit televote for ${name} in edition ${editionId}`);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to submit televotes.' };
	}
}
