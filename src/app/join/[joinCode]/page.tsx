import JoinContestCard from '@/components/JoinContestCard';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';

export default async function ContestPage({ params }: { params: Promise<{ joinCode: string }> }) {
	const resolvedParams = await params;
	const joinCode = resolvedParams.joinCode;
	const authUser = await AuthGetCurrentUserServer();

	return (
		<div className="min-h-screen bg-background p-4">
			<div className={'max-w-md mx-auto'}>
				<JoinContestCard user={authUser} joinCode={joinCode} />
			</div>
		</div>
	);
}
