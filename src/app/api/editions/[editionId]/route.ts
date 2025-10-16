import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';
import { Schema } from '../../../../../amplify/data/resource';
import { EditionWithDetails } from '@/types/Edition';
import { SubmissionWithScore } from '@/components/ResultsComponent';

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

const tiebreakSorter = (externalData: string[][]) => {
	try {
		// --- Counting Logic ---
		// Pre-calculate the count array [Count@Index0, Count@Index1, ..., Count@Index9]
		const calculateCountArray = (id: string): number[] => {
			// Initialize an array of 10 zeros
			const counts = new Array<number>(10).fill(0);

			// Iterate over every inner array in the external data
			for (const innerArray of externalData) {
				// Check the first 10 positions (index 0 to 9) of the current inner array
				const limit = Math.min(innerArray.length, 10);

				for (let i = 0; i < limit; i++) {
					if (innerArray[i] === id) {
						// Increment the count for that specific index (i)
						counts[i]++;
					}
				}
			}
			return counts;
		};

		// Cache to store the pre-calculated count array for each ID
		const idCountCache = new Map<string, number[]>();

		const getCountArray = (id: string): number[] => {
			if (idCountCache.has(id)) {
				return idCountCache.get(id)!;
			}
			const countArray = calculateCountArray(id);
			idCountCache.set(id, countArray);
			return countArray;
		};

		// --- The Comparison Function ---
		const complexSorter = (a: SubmissionWithScore, b: SubmissionWithScore): number => {
			// 1. Primary Sort: Score (Descending)
			let comparison = b.score - a.score;
			if (comparison !== 0) {
				return comparison;
			}

			// --- 2. Secondary Sort: Sequential ID Count (Descending) ---
			const aCounts = getCountArray(a.submissionId);
			const bCounts = getCountArray(b.submissionId);

			// Iterate from index 0 up to 9
			for (let i = 0; i < 10; i++) {
				// Compare the counts at the current index (Descending)
				comparison = bCounts[i] - aCounts[i];

				// If the counts are different, this is our tie-breaker—return the result immediately
				if (comparison !== 0) {
					return comparison;
				}
				// If they are equal (comparison === 0), the loop continues to the next index (i+1)
			}

			// 3. Tertiary Sort: RunningOrder (Ascending)
			// This is only reached if score and ALL 10 sequential counts were identical
			return (a.runningOrder as number) - (b.runningOrder as number);
		};
		return complexSorter;
	} catch (error) {
		console.log('Error while sorting songs:', JSON.stringify(error));
	}
};

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
			console.log('phase is results');
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

				submissionsWithScores = [...submissionsWithScores, { ...s, score: score }];
			});
		}

		const editionData: EditionWithDetails = {
			...data,
			submissionList:
				data?.phase === 'RESULTS'
					? submissionsWithScores.sort(tiebreakSorter(rankingsResp?.data.map((r) => r.rankingList as string[]) as string[][]))
					: // submissionsWithScores
						(submissionsResp as Submission[] | undefined),
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
