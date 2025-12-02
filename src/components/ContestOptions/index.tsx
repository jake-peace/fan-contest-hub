import { Plus, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

const ContestOptions: React.FC<{ contestId: string }> = ({ contestId }) => {
	const router = useRouter();

	return (
		<div className="flex items-center gap-2 mt-2">
			<Button onClick={() => router.push(`/create/${contestId}/edition`)}>
				<Plus className="h-4 w-4" />
				Create Edition
			</Button>
			<Button variant="secondary" onClick={() => router.push(`/contest/${contestId}/settings`)}>
				<Settings className="h-4 w-4" />
				Options
			</Button>
		</div>
	);
};

export default ContestOptions;
