import ContestInfoCard from '@/components/ContestCard';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';

export default async function ContestPage({ params }: { params: Promise<{ contestId: string }> }) {
	const resolvedParams = await params;
	const contestId = resolvedParams.contestId;
	const authUser = await AuthGetCurrentUserServer();

	return <ContestInfoCard contestId={contestId} user={authUser as AuthUser} />;
}
