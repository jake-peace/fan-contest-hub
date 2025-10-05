import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ editionId: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;

	try {
		const { data } = await cookiesClient.models.Edition.get({ editionId: params.editionId });
		const contestResp = await data?.contest();

		if (!contestResp || !contestResp.data || !contestResp.data.participants) {
			throw new Error('Failed to get participant data.');
		}

		const userIds = contestResp.data.participants.map((p) => {
			return cookiesClient.models.Profile.get({
				userId: p,
			});
		});

		const profiles = await Promise.all(userIds);

		if (profiles === undefined) {
			throw new Error('Failed to get participant data.');
		}

		return NextResponse.json({ profiles: profiles });
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
