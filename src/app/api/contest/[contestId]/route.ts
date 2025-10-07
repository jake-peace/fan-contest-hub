import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ contestId: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;
	const contestId = params.contestId;

	try {
		const { data } = await cookiesClient.models.Contest.get({ contestId: contestId });

		return NextResponse.json({ contest: data });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		// 3. Handle authentication failures (e.g., redirect or return 401)
		if (error.name === 'NotAuthorizedError') {
			return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
