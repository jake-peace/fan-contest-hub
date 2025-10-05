import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ contestId: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	try {
		const params = await segmentData.params;
		const contestId = params.contestId;

		const { data: contestData } = await cookiesClient.models.Contest.get({ contestId: contestId });

		const { data } = await cookiesClient.models.Profile.list({
			filter: {
				or: (contestData?.participants as string[]).map((id: string) => ({ userId: { eq: id } })),
			},
		});

		// 2. The client never sees the auth token or the GraphQL endpoint.
		// The response is a plain JSON object.
		return NextResponse.json({ participants: data });
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
