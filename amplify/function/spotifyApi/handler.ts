import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
	const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
	const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
	// ... (Rest of the refresh token logic using fetch, similar to route.ts)

	// Safety check for required environment variables
	if (!CLIENT_ID || !CLIENT_SECRET) {
		console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET environment variables.');
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Server configuration error: Missing credentials.' }),
		};
	}

	const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

	const params = new URLSearchParams({
		grant_type: 'client_credentials',
	});

	try {
		// 3. Make the secure POST request to Spotify's token endpoint
		const response = await fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',
			headers: {
				// Use the securely encoded client credentials
				Authorization: `Basic ${authHeader}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: params.toString(),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('Spotify token refresh failed. Status:', response.status, 'Error:', data);
			return {
				statusCode: 502, // Bad Gateway (External API Error)
				body: JSON.stringify({ error: 'Failed to refresh token with Spotify.' }),
			};
		}

		return {
			statusCode: 200,
			body: data.access_token,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		};
	} catch (error) {
		console.error('Network or unknown error during Spotify refresh:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Internal server error.' }),
		};
	}
};
