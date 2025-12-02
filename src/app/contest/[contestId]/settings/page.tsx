import ContestSettings from '@/components/ContestSettings';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';
import { cookies } from 'next/headers';

export default async function ContestSettingsPage({ params }: { params: Promise<{ contestId: string }> }) {
	const resolvedParams = await params;
	const contestId = resolvedParams.contestId;
	const currentRequestCookies = cookies;
	const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

	return <ContestSettings contestId={contestId} user={authUser as AuthUser} />;
}
