import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type Params = Promise<{ contestId: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;
	const contestId = params.contestId;

	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		const { data } = await cookiesClient.models.Edition.list({
			filter: {
				contestId: { eq: contestId },
			},
			limit: 10000,
		});

		const promises = data.map(async (e) => {
			const submissions = (await e.submissions({ limit: 10000 })).data;
			const rankings = (await e.rankings({ limit: 10000 })).data;
			const newObject = {
				...e,
				hasVoted: rankings.some((r) => r.userId === authUser?.userId),
				hasSubmitted: submissions.some((s) => s.userId === authUser?.userId && !s.rejected),
			};
			return newObject;
		});

		const returnData = await Promise.all(promises);

		return NextResponse.json({ editions: returnData });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
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
