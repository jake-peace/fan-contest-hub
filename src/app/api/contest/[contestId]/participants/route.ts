import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ contestId: string }>;

// const rankingPoints = new Map<number, number>([
// 	[-1, 0],
// 	[0, 12],
// 	[1, 10],
// 	[2, 8],
// 	[3, 7],
// 	[4, 6],
// 	[5, 5],
// 	[6, 4],
// 	[7, 3],
// 	[8, 2],
// 	[9, 1],
// ]);

export async function GET(request: Request, segmentData: { params: Params }) {
	try {
		const params = await segmentData.params;
		const contestId = params.contestId;

		const { data: contestData } = await cookiesClient.models.Contest.get({ contestId: contestId });

		if (!contestData) {
			throw new Error('Cannot find contest');
		}

		const { data } = await cookiesClient.models.Profile.list({
			filter: {
				or: (contestData?.participants as string[]).map((id: string) => ({ userId: { eq: id } })),
			},
			limit: 10000,
		});

		// const editionsData = (await contestData.editions({ limit: 10000 })).data;

		// if (!editionsData) {
		// 	throw new Error('Failed to find edition data.');
		// }

		// const editionList = editionsData
		// 	.filter((e) => e.phase !== 'SUBMISSION' && e.phase !== 'UPCOMING' && e.phase !== 'VOTING')
		// 	.map((e) => e.editionId);

		// const { data: allContestSubmissions } = await cookiesClient.models.Submission.list({
		// 	filter: {
		// 		or: (editionList as string[]).map((e: string) => ({ editionId: { eq: e } })),
		// 	},
		// });

		// const scorePromises = allContestSubmissions.map(async (s) => {
		// 	const { data: submissionData } = await cookiesClient.models.Submission.get({ submissionId: s.submissionId });

		// 	if (!submissionData) {
		// 		throw new Error('Cannot find submission');
		// 	}

		// 	const { data: rankingData } = await cookiesClient.models.Ranking.list({
		// 		filter: {
		// 			editionId: { eq: submissionData.editionId as string },
		// 		},
		// 	});

		// 	if (!rankingData) {
		// 		throw new Error('Failed to find edition data.');
		// 	}

		// 	let score = 0;

		// 	rankingData.forEach((r) => {
		// 		const songScore = rankingPoints.get(r.rankingList?.indexOf(s.submissionId) as number) as number;
		// 		score = score + songScore;
		// 	});
		// 	return { ...s, score: score };
		// });

		// const allContestSubmissionsWithScores = await Promise.all(scorePromises);

		// const participantsWithEntries: ProfileWithEntries[] = data.map((p) => {
		// 	return { ...p, entries: allContestSubmissions.filter((s) => s.userId === p.userId) };
		// 	// return { ...p, entries: [] };
		// });

		return NextResponse.json({ participants: data });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error('Server Action failed:', error);
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
