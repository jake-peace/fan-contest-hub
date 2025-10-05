import { defineAuth } from '@aws-amplify/backend';
import { postConfirmationHandler } from '../function/postConfirmationTrigger/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
	loginWith: {
		email: true,
	},
	userAttributes: {
		nickname: {
			mutable: true,
			required: false,
		},
	},
	triggers: {
		postConfirmation: postConfirmationHandler,
	},
});
