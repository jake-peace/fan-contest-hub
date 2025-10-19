'use server';

import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';

Amplify.configure(outputs, { ssr: true });

const client = generateClient<Schema>();

export async function submitTelevote(rankings: string[], editionId: string, name: string) {
	try {
		const { errors } = await client.queries.televoteSubmitter({ ranking: rankings, name: name, editionId: editionId });

		if (errors) {
			throw new Error(`Unknown error when trying to submit televote for ${name} in edition ${editionId}`);
		}

		return { success: true };
	} catch (error) {
		console.error('Server Action failed:', error);
		return { success: false, error: 'Failed to submit televotes.' };
	}
}
