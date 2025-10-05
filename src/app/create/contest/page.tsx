import CreateContest from '@/components/CreateContestForm';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';

export default async function CreateContestPage() {
	const authUser = await AuthGetCurrentUserServer();

	return (
		<div className="min-h-screen bg-background p-4">
			<div className={'max-w-md mx-auto'}>
				<CreateContest user={authUser as AuthUser} />
			</div>
		</div>
	);
}
