import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ contestId: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;
	const contestId = params.contestId;

	try {
		const { data } = await cookiesClient.models.Contest.get(
			{
				contestId: contestId,
			},
			{
				selectionSet: [
					'name',
					'description',
					'participants',
					'joinCode',
					'hostId',
					'editions.editionId',
					'editions.phase',
					'editions.submissionsOpen',
					'editions.closeSubmissionType',
					'editions.submissionDeadline',
					'editions.closeVotingType',
					'editions.votingDeadline',
					'editions.name',
					'editions.rankings.userId',
					'editions.submissions.userId',
				],
			}
		);

		return NextResponse.json({ contest: data });
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
