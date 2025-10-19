import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { submitBatchVotes } from './function/submit-batch-votes/resource';
import { spotifyApi } from './function/spotifyApi/resource';
import { phaseUpdater } from './function/phaseUpdater/resource';
import { postConfirmationHandler } from './function/postConfirmationTrigger/resource';
import { televoteSubmitter } from './function/televoteSubmitter/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
	auth,
	data,
	submitBatchVotes,
	spotifyApi,
	phaseUpdater,
	postConfirmationHandler,
	televoteSubmitter,
});

const { cfnResources } = backend.auth.resources;
const { cfnUserPool, cfnUserPoolClient } = cfnResources;

// Specify which authentication factors you want to allow with USER_AUTH
cfnUserPool.addPropertyOverride('Policies.SignInPolicy.AllowedFirstAuthFactors', ['PASSWORD', 'EMAIL_OTP']);

// The USER_AUTH flow is used for passwordless sign in
cfnUserPoolClient.explicitAuthFlows = ['ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_AUTH'];
