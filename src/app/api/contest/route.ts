import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

export async function GET() {
	try {
		const authUser = await AuthGetCurrentUserServer();
		// 1. Fetch data securely using the cookieBasedClient on the server
		const { data } = await cookiesClient.models.Contest.list({
			filter: {
				participants: {
					contains: authUser?.userId,
				},
			},
		});
		// 2. The client never sees the auth token or the GraphQL endpoint.
		// The response is a plain JSON object.
		return NextResponse.json({ contests: data });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		// 3. Handle authentication failures (e.g., redirect or return 401)
		if (error.name === 'NotAuthorizedError') {
			return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new NextResponse(JSON.stringify({ error: `Internal Server Error, ${error.message}` }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
