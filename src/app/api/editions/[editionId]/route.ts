import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';
import { Schema } from '../../../../../amplify/data/resource';
import { EditionWithDetails } from '@/types/Edition';

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

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;

	try {
		// 1. Fetch data securely using the cookieBasedClient on the server
		const { data } = await cookiesClient.models.Edition.get({ editionId: params.editionId });

		const submissionsResp = await data?.submissions();
		const contestResp = await data?.contest();
		const rankingsResp = await data?.rankings();

		const editionData: EditionWithDetails = {
			...data,
			submissionList: submissionsResp?.data as Submission[] | undefined,
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
