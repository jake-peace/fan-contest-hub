import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';
import { Schema } from '../../../../../amplify/data/resource';
import { EditionWithDetails } from '@/types/Edition';
import { SubmissionWithScore, tiebreakSorter } from '@/components/ResultsComponent';

type Params = Promise<{ editionId: string }>;
type Submission = Schema['Submission']['type'];
type Contest = Schema['Contest']['type'];
// type Edition = Schema['Edition']['type'];
type Ranking = Schema['Ranking']['type'];

// interface EditionWithDetails extends Edition {
// 	contestDetails: Contest;
// 	submissionList?: Submission[];
// 	rankingsList?: Ranking[];
// }

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

		let submissionsWithScores: SubmissionWithScore[] = [];

		if (data?.phase === 'RESULTS') {
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

				const finalScore = counts.reduce((acc, value, index) => {
					return acc + value * (rankingPoints.get(index) as number);
				});

				submissionsWithScores = [...submissionsWithScores, { ...s, score: finalScore }];
			});
		}

		const editionData: EditionWithDetails = {
			...data,
			submissionList:
				data?.phase === 'RESULTS'
					? submissionsWithScores.sort(tiebreakSorter(rankingsResp?.data.map((r) => r.rankingList as string[]) as string[][]))
					: (submissionsResp as Submission[] | undefined),
			contestDetails: contestResp?.data as Contest,
			rankingsList: rankingsResp?.data as Ranking[] | undefined,
		} as EditionWithDetails;

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
