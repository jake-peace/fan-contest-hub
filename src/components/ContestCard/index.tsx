import { Music } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppSelector } from '@/app/store/hooks';
import { Spinner } from '../ui/spinner';
import ContestOptions from '../ContestOptions';
import { User } from '@/types/Contest';
import { useAmplifyClient } from '@/app/amplifyConfig';
import { useQuery } from '@tanstack/react-query';
import { SelectionSet } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import { useRouter } from 'next/navigation';
import EditionList from '../EditionList';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const selectionSet = ['contestId', 'name', 'description', 'hostId', 'participants'] as const;
type Contest = SelectionSet<Schema['Contest']['type'], typeof selectionSet>;

const ContestInfoCard: React.FC = () => {
	const contest = useAppSelector((state) => state.contest.contestId);
	const currentUser = useAppSelector((state) => state.user.user);
	const client = useAmplifyClient();
	const router = useRouter();

	const {
		data: contestInfo,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['contestInfoQuery'],
		queryFn: async () => {
			const response = await client.models.Contest.get({
				contestId: contest,
			});
			const responseData = response.data;
			if (!responseData) {
				router.push('/');
			}
			return responseData as unknown as Contest;
		},
	});

	if (isLoading) {
		return <Spinner />;
	}

	if (!isLoading && !contestInfo) {
		refetch();
	}

	return (
		contestInfo && (
			<>
				<Card className="mb-4 py-6">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Music className="w-5 h-5" />
								{contestInfo.name}
							</CardTitle>
							<Badge variant="secondary">
								{`${contestInfo.participants?.length} ${contestInfo.participants?.length === 1 ? 'participant' : 'participants'}`}
							</Badge>
						</div>
						<p className="text-muted-foreground">{contestInfo.description}</p>
						{(currentUser as User).id === contestInfo.hostId && <ContestOptions />}
					</CardHeader>
				</Card>

				<EditionList contest={contestInfo} />
			</>
		)
	);
};

export default ContestInfoCard;
