import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
	const getHostProfile = async (userId: string) => {
		const { data: profile } = await cookiesClient.models.Profile.get({ userId: userId });
		return profile;
	};

	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);
		// 1. Fetch data securely using the cookieBasedClient on the server
		const { data } = await cookiesClient.models.Contest.list({
			filter: {
				participants: {
					contains: authUser?.userId,
				},
			},
		});

		const promises = data.map(async (c) => {
			const editions = (await c.editions()).data;
			const hostName = (await getHostProfile(c.hostId as string))?.displayName;
			const newObject = { ...c, fulfilledEditions: editions, hostName: hostName };
			return newObject;
		});

		const returnData = await Promise.all(promises);

		// 2. The client never sees the auth token or the GraphQL endpoint.
		// The response is a plain JSON object.
		return NextResponse.json({ contests: returnData });
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
