import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type Params = Promise<{ editionId: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;
	const editionId = params.editionId;

	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		if (!authUser) {
			throw new Error('Not authenticated.');
		}

		const { data } = await cookiesClient.models.SavedRanking.list({
			filter: {
				userId: { eq: authUser.userId },
				editionId: { eq: editionId },
			},
		});

		if (data.length === 0) {
			return NextResponse.json({ undefined });
		}

		return NextResponse.json({ ranking: data[0] });
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
