import SongSubmission from '@/components/SongSubmission';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';

export default async function SubmitSongPage({ params }: { params: Promise<{ editionId: string }> }) {
	const resolvedParams = await params;
	const editionId = resolvedParams.editionId;
	const authUser = await AuthGetCurrentUserServer();

	return (
		<div className="min-h-screen bg-background p-4">
			<div className={'max-w-md mx-auto'}>
				<SongSubmission editionId={editionId} user={authUser as AuthUser} />
			</div>
		</div>
	);
}
