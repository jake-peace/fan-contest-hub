import JoinContestCard from '@/components/JoinContestCard';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

export default async function ContestPage({ params }: { params: Promise<{ joinCode: string }> }) {
	const resolvedParams = await params;
	const joinCode = resolvedParams.joinCode;
	const currentRequestCookies = cookies;
	const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

	return <JoinContestCard user={authUser} joinCode={joinCode} />;
}
