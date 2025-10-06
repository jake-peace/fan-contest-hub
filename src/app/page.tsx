import DashboardPage from '@/components/Dashboard';
import { AuthGetCurrentUserServer } from '@/utils/amplify-utils';
import { AuthUser } from 'aws-amplify/auth';

export default async function Page() {
	const authUser = await AuthGetCurrentUserServer();

	return <DashboardPage user={authUser as AuthUser} />;
}
