import ResultsComponent from '@/components/ResultsComponent';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';

export default async function ResultsPage({ params }: { params: Promise<{ editionId: string }> }) {
	const resolvedParams = await params;
	const editionId = resolvedParams.editionId;
	const authUser = await AuthGetCurrentUserServer();

	return <ResultsComponent editionId={editionId} user={authUser as AuthUser} />;
}
