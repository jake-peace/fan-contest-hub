import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';
import { Schema } from '../../../../../../amplify/data/resource';
import { EditionWithDetails } from '@/types/Edition';
import { SubmissionWithScore } from '@/components/ResultsComponent';

type Params = Promise<{ editionId: string }>;
type Contest = Schema['Contest']['type'];
type Edition = Schema['Edition']['type'];
type Ranking = Schema['Ranking']['type'];
type Televote = Schema['Televote']['type'];

export interface EditionWithResults extends Edition {
	contestDetails: Contest;
	submissionList: SubmissionWithScore[];
	rankingsList: Ranking[];
	televoteList: Televote[];
}

const rankingPoints = new Map<number, number>([
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
	const params = await segmentData.params;

	try {
		// 1. Fetch data securely using the cookieBasedClient on the server
		const { data } = await cookiesClient.models.Edition.get({ editionId: params.editionId });

		if (!data) {
			throw new Error('Edition not found');
		}

		const submissionsResp = (await data.submissions()).data;
		const contestResp = await data?.contest();
		const rankingsResp = await data?.rankings();
		const televoteResp = await data?.televotes();

		let submissionsWithScores: SubmissionWithScore[] = [];

		submissionsResp?.forEach((s) => {
			const counts = new Array<number>(10).fill(0);

			// Iterate over every inner array in the external data
			for (const innerArray of rankingsResp?.data.map((r) => r.rankingList as string[]) as string[][]) {
				// Check the first 10 positions (index 0 to 9) of the current inner array
				const limit = Math.min(innerArray.length, 10);

				for (let i = 0; i < limit; i++) {
					if (innerArray[i] === s.submissionId) {
						// Increment the count for that specific index (i)
						counts[i]++;
					}
				}
			}

			let score = 0;
			counts.forEach((c, index) => {
				if (c !== 0) {
					score = score + c * (rankingPoints.get(index) as number);
				}
			});

			// do the same for the televotes
			const teleCounts = new Array<number>(10).fill(0);

			for (const innerArray of televoteResp?.data.map((r) => r.rankingList as string[]) as string[][]) {
				// Check the first 10 positions (index 0 to 9) of the current inner array
				const limit = Math.min(innerArray.length, 10);

				for (let i = 0; i < limit; i++) {
					if (innerArray[i] === s.submissionId) {
						// Increment the count for that specific index (i)
						teleCounts[i]++;
					}
				}
			}

			teleCounts.forEach((c, index) => {
				if (c !== 0) {
					score = score + c * (rankingPoints.get(index) as number);
				}
			});

			submissionsWithScores = [...submissionsWithScores, { ...s, score: score }];
		});

		const editionData: EditionWithDetails = {
			...data,
			submissionList: submissionsWithScores.sort((a, b) => b.score - a.score) as SubmissionWithScore[],
			contestDetails: contestResp?.data as Contest,
			rankingsList: rankingsResp?.data as Ranking[],
			televoteList: televoteResp?.data as Televote[],
		} as EditionWithResults;

		return NextResponse.json({ edition: editionData });
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
