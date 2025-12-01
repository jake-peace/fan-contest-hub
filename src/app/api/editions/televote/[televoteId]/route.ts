import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';
import { EditionWithDetails } from '@/types/Edition';
import { Schema } from '../../../../../../amplify/data/resource';

type Params = Promise<{ televoteId: string }>;
type Submission = Schema['Submission']['type'];
type Contest = Schema['Contest']['type'];

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;

	try {
		// 1. Fetch data securely using the cookieBasedClient on the server
		const { data } = await cookiesClient.models.Edition.list({
			filter: {
				televoteId: { eq: params.televoteId },
			},
			authMode: 'identityPool',
			limit: 10000,
		});

		if (!data) {
			throw new Error('Edition not found');
		}

		if (data.length !== 1) {
			throw new Error('Edition data mishapen.');
		}

		const submissionsResp = (await data[0].submissions({ limit: 10000 })).data;
		const contestResp = await data[0]?.contest();

		const editionData: EditionWithDetails = {
			...data[0],
			submissionList: submissionsResp as Submission[] | undefined,
			contestDetails: contestResp?.data as Contest,
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
