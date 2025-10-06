import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ editionId: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;
	const editionId = params.editionId;

	try {
		const { data: edition } = await cookiesClient.models.Edition.get({ editionId: editionId });
		const submissions = await edition?.submissions();

		const submissionIds = submissions?.data.map((s) => s.submissionId);

		if (!submissionIds || submissionIds.length === 0) {
			return NextResponse.json({ votes: [] });
		}

		const { data } = await cookiesClient.models.Vote.list({
			filter: {
				or: submissionIds.map((id) => ({ submissionId: { eq: id } })),
			},
		});

		return NextResponse.json({ votes: data });
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
