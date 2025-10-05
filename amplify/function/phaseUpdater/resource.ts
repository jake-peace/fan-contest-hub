import { defineFunction } from '@aws-amplify/backend';

export const phaseUpdater = defineFunction({
	name: 'status-updater',
	schedule: '0/15 * * * ? *',
});
