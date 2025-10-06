import CreateContest from '@/components/CreateContestForm';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';

export default async function CreateContestPage() {
	const authUser = await AuthGetCurrentUserServer();

	return <CreateContest user={authUser as AuthUser} />;
}
