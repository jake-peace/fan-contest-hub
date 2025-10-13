import EditionDetails from '@/components/EditionDetails';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';
import { cookies } from 'next/headers';

export default async function EditionPage({ params }: { params: Promise<{ editionId: string }> }) {
	const resolvedParams = await params;
	const editionId = resolvedParams.editionId;
	const currentRequestCookies = cookies;
	const authUser = await AuthGetCurrentUserServer(currentRequestCookies);

	return <EditionDetails editionId={editionId} user={authUser as AuthUser} />;
}
