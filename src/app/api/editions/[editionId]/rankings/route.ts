import { SubmissionWithScore } from '@/components/ResultsList';
import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type Params = Promise<{ editionId: string }>;

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
	const params = await segmentData.params;
	const editionId = params.editionId;

	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		if (!authUser) {
			throw new Error('Not authenticated.');
		}

		const { data } = await cookiesClient.models.Edition.get(
			{ editionId: editionId },
			{
				selectionSet: [
					'rankings.rankingList',
					'televotes.rankingList',
					'submissions.songTitle',
					'submissions.artistName',
					'submissions.flag',
					'submissions.countryName',
					'submissions.submissionId',
					'submissions.rejected',
				],
			}
		);

		if (!data) {
			throw new Error('No data found.');
		}

		if (!data.submissions) {
			throw new Error('No submissions found.');
		}

		let submissionsWithScores: SubmissionWithScore[] = [];

		data.submissions
			.filter((s) => !s.rejected)
			.forEach((s) => {
				const counts = new Array<number>(10).fill(0);

				// Iterate over every inner array in the external data
				for (const innerArray of data?.rankings.map((r) => r.rankingList as string[]) as string[][]) {
					// Check the first 10 positions (index 0 to 9) of the current inner array
					const limit = Math.min(innerArray.length, 10);

					for (let i = 0; i < limit; i++) {
						if (innerArray[i] === s.submissionId) {
							// Increment the count for that specific index (i)
							counts[i]++;
						}
					}
				}

				for (const innerArray of data.televotes.map((r) => r.rankingList as string[]) as string[][]) {
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

		return NextResponse.json({ edition: submissionsWithScores });
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
