import { type Schema } from '../../data/resource';
import { v4 } from 'uuid';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
// import { env } from '$amplify/env/televoteSubmitter';

// const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

// Amplify.configure(resourceConfig, libraryOptions);

// 2. Generate the client after configuring
const client = generateClient<Schema>();

export const handler: Schema['televoteSubmitter']['functionHandler'] = async (event) => {
	const { ranking, name, editionId } = event.arguments;

	if (!ranking || ranking.length === 0) {
		return 'No ranking found';
	}

	try {
		const newId = v4();
		await client.models.Televote.create({
			televoteId: newId,
			rankingList: ranking,
			guestName: name,
			editionId: editionId,
		});

		return `Success`;
	} catch (error) {
		console.error('Batch create failed:', error);
		return `Failure due to ${error}`;
	}
};
