import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ submissionId: string }>;

const rankingPoints = new Map<number, number>([
	[-1, 0],
	[0, 12],
	[1, 10],
	[2, 8],
	[3, 7],
	[4, 6],
	[5, 5],
	[6, 4],
	[7, 3],
	[8, 2],
	[9, 1],
]);

export async function GET(request: Request, segmentData: { params: Params }) {
	try {
		const params = await segmentData.params;
		const submissionId = params.submissionId;

		const { data: submissionData } = await cookiesClient.models.Submission.get({ submissionId: submissionId });

		if (!submissionData) {
			throw new Error('Cannot find submission');
		}

		const { data: rankingData } = await cookiesClient.models.Ranking.list({
			filter: {
				editionId: { eq: submissionData.editionId as string },
			},
		});

		if (!rankingData) {
			throw new Error('Failed to find edition data.');
		}

		let score = 0;

		rankingData.forEach((r) => {
			const songScore = rankingPoints.get(r.rankingList?.indexOf(submissionId) as number) as number;
			score = score + songScore;
		});

		return NextResponse.json({ score: score });
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
