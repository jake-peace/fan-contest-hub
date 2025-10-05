import VotingComponent from '@/components/VotingComponent';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';

export default async function VotePage({ params }: { params: Promise<{ editionId: string }> }) {
	const resolvedParams = await params;
	const editionId = resolvedParams.editionId;
	const authUser = await AuthGetCurrentUserServer();

	return (
		<div className="min-h-screen bg-background p-4">
			<div className={'max-w-md mx-auto'}>
				<VotingComponent editionId={editionId} user={authUser as AuthUser} />
			</div>
		</div>
	);
}
