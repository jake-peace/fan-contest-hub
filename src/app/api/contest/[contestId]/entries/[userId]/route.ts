import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';
import { Schema } from '../../../../../../../amplify/data/resource';

type Params = Promise<{ contestId: string; userId: string }>;
type Submission = Schema['Submission']['type'];

export async function GET(request: Request, segmentData: { params: Params }) {
	try {
		const params = await segmentData.params;
		const contestId = params.contestId;
		const userId = params.userId;

		const { data: contestData } = await cookiesClient.models.Contest.get({ contestId: contestId });

		if (!contestData) {
			throw new Error('Contest not found.');
		}

		const editionsData = (await contestData.editions()).data;

		let entries: Submission[] = [];

		editionsData.forEach(async (e) => {
			const submissionsData = (await e.submissions()).data;
			entries = [...entries, ...submissionsData.filter((s) => s.userId === userId)];
			console.log(entries);
		});

		// 2. The client never sees the auth token or the GraphQL endpoint.
		// The response is a plain JSON object.
		return NextResponse.json({ entries: entries });
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
