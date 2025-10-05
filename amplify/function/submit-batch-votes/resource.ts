import { defineFunction } from '@aws-amplify/backend';

export const submitBatchVotes = defineFunction({
	name: 'submit-batch-votes',
	entry: './handler.ts',
});
