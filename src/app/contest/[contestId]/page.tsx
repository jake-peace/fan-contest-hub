import ContestInfoCard from '@/components/ContestCard';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';
import { cookies } from 'next/headers';

export default async function ContestPage({ params }: { params: Promise<{ contestId: string }> }) {
	const resolvedParams = await params;
	const contestId = resolvedParams.contestId;
	const currentRequestCookies = cookies;
	const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

	return <ContestInfoCard contestId={contestId} user={authUser as AuthUser} />;
}
