import { AuthGetCurrentUserServer, cookiesClient } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type Params = Promise<{ editionId: string; userId: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;
	const editionId = params.editionId;
	const userId = params.userId;

	try {
		const currentRequestCookies = cookies;
		const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

		if (!authUser) {
			throw new Error('Not authenticated.');
		}

		console.log(`edition: ${editionId}, user: ${userId}`);

		const { data } = await cookiesClient.models.Ranking.listByEditionAndUser(
			{
				editionId: editionId,
				userId: { eq: userId },
			},
			{
				selectionSet: [
					'rankingList',
					'edition.submissions.songTitle',
					'edition.submissions.artistName',
					'edition.submissions.submissionId',
					'edition.submissions.countryName',
					'edition.submissions.flag',
				],
			}
		);

		console.log(data);

		return NextResponse.json({ ranking: data });
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
