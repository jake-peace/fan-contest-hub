import EditionStatus from '@/components/EditionStatusComponent';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';
import { cookies } from 'next/headers';

export default async function EditionStatusPage({ params }: { params: Promise<{ editionId: string }> }) {
	const resolvedParams = await params;
	const editionId = resolvedParams.editionId;
	const currentRequestCookies = cookies;
	const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

	return <EditionStatus editionId={editionId} user={authUser as AuthUser} />;
}
