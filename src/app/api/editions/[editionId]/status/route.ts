import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type Params = Promise<{ editionId: string }>;

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
			{ selectionSet: ['contest.participants', 'phase', 'contest.hostId', 'rankings.userId', 'submissions.userId', 'savedRankings.userId'] }
		);

		if (!data) {
			throw new Error('No data found.');
		}

		// let actionedParticipants: string[] = [];

		// if (data.phase === 'SUBMISSION') {
		// 	const { data: participants } = await cookiesClient.models.Submission.list({
		// 		filter: {
		// 			or: (data.contest.participants as string[]).map((id: string) => ({ userId: { eq: id } })),
		// 			and: { editionId: { eq: editionId } },
		// 		},
		// 		limit: 10000,
		// 		selectionSet: ['userId'],
		// 	});
		// 	actionedParticipants = [...participants.map((p) => p.userId as string)];
		// } else {
		// 	const { data: participants } = await cookiesClient.models.Ranking.list({
		// 		filter: {
		// 			or: (data.contest.participants as string[]).map((id: string) => ({ userId: { eq: id } })),
		// 			and: { editionId: { eq: editionId } },
		// 		},
		// 		limit: 10000,
		// 		selectionSet: ['userId'],
		// 	});
		// 	actionedParticipants = [...participants.map((p) => p.userId as string)];
		// }

		// console.log(actionedParticipants);

		// const participantsWithPhase = { actionedParticipants: actionedParticipants, phase: data.phase, contestHost: data.contest.hostId };

		return NextResponse.json({ edition: data });
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
