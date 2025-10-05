import { defineFunction, secret } from '@aws-amplify/backend';

export const spotifyApi = defineFunction({
	name: 'spotifyApi',
	// Store your secrets securely as environment variables in the Lambda itself
	environment: {
		SPOTIFY_CLIENT_ID: secret('SPOTIFY_CLIENT_ID'),
		SPOTIFY_CLIENT_SECRET: secret('SPOTIFY_CLIENT_SECRET'),
	},
});
