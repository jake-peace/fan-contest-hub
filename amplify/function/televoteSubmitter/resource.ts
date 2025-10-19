import { defineFunction } from '@aws-amplify/backend';

export const televoteSubmitter = defineFunction({
	name: 'televoteSubmitter',
	entry: './handler.ts',
});
