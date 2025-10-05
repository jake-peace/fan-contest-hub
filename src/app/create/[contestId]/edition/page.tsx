import CreateEdition from '@/components/CreateEditionForm';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';

export default async function CreateEditionPage({ params }: { params: Promise<{ contestId: string }> }) {
	const resolvedParams = await params;
	const contestId = resolvedParams.contestId;
	const authUser = await AuthGetCurrentUserServer();

	return (
		<div className="min-h-screen bg-background p-4">
			<div className={'max-w-md mx-auto'}>
				<CreateEdition user={authUser as AuthUser} contestId={contestId} />
			</div>
		</div>
	);
}
