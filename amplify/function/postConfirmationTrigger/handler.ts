import type { PostConfirmationTriggerHandler } from 'aws-lambda';
// Import the generated client type for type safety
import { type Schema } from '../../data/resource';
import { generateClient } from 'aws-amplify/api';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
// @ts-ignore
import { env } from '$amplify/env/postConfirmationHandler';
import { Amplify } from 'aws-amplify';
/**
 * Handles the Cognito Post-Confirmation trigger.
 * This runs immediately after a user successfully verifies their email or phone.
 * The primary purpose here is to create a corresponding entry in the Profile DynamoDB table.
 */

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
	// 1. Log the event for debugging (optional)
	console.log('Post Confirmation Event:', JSON.stringify(event, null, 2));

	// 2. Extract necessary user attributes from the event
	const userAttributes = event.request.userAttributes;

	// The user's unique ID (sub) is the primary key for our Profile model
	const userId = userAttributes.sub;
	const displayName = userAttributes.nickname;

	// We should only proceed if we have the necessary data
	if (!userId || !displayName) {
		console.error('Missing required attributes (sub or displayname). Skipping profile creation.');
		return event;
	}

	try {
		// 3. Initialize the Amplify Data Client
		// This client is configured by Amplify to communicate securely with your AppSync API

		// 4. Create the new Profile record
		await client.models.Profile.create({
			userId: userId,
			displayName: displayName,
		});

		console.log(`Successfully created Profile record for user: ${userId}`);
	} catch (error) {
		// Note: Errors in a Post Confirmation trigger do NOT prevent the user from signing up,
		// but they should be logged and investigated.
		console.error('Error creating Profile record in DynamoDB:', error);
	}

	// Always return the event object
	return event;
};
