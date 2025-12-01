import { cookiesClient } from '@/utils/amplify-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ joinCode: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
	const params = await segmentData.params;
	const joinCode = params.joinCode;

	try {
		const { data } = await cookiesClient.models.Contest.list({
			filter: {
				joinCode: { eq: joinCode },
			},
			limit: 10000,
		});

		if (data.length !== 1) {
			throw new Error('More than one contest with the same join code found.');
		}

		return NextResponse.json({ contest: data[0] });
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
