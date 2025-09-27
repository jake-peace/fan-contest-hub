import AuthBarrier from '@/components/AuthBarrier';
import DashboardPage from '@/components/Dashboard';

export default function Page() {
	return (
		<AuthBarrier>
			<DashboardPage />
		</AuthBarrier>
	);
}
