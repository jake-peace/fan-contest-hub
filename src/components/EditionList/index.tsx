import { sortedEditions, getPhaseMessage } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { User } from '@/types/Contest';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setEdition } from '@/app/store/reducers/contestReducer';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { SelectionSet } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import { useQuery } from '@tanstack/react-query';
import { useAmplifyClient } from '@/app/amplifyConfig';
import { toast } from 'sonner';
import { Spinner } from '../ui/spinner';

interface EditionListProps {
	contest: Contest;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const selectionSet = ['contestId', 'name', 'description', 'hostId', 'participants'] as const;
type Contest = SelectionSet<Schema['Contest']['type'], typeof selectionSet>;
type Edition = Schema['Edition']['type'];

const EditionList: React.FC<EditionListProps> = ({ contest }) => {
	const dispatch = useAppDispatch();
	const client = useAmplifyClient();

	const currentUser = useAppSelector((state) => state.user.user);

	const {
		data: editions,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['editionListQuery'],
		queryFn: async () => {
			const response = await client.models.Edition.list({
				filter: {
					contestId: {
						eq: contest.contestId as string,
					},
				},
			});
			const responseData = response.data;
			if (!responseData) {
				toast.error('No editions found');
			}
			console.log(responseData);
			return responseData as unknown as Edition[];
		},
	});

	if (isLoading) {
		return <Spinner />;
	}

	if (!isLoading && !editions) {
		refetch();
	}

	// const sortedEditions = (editions: Edition[]): Edition[] => {
	//     return [...editions].sort((a: Edition['phase'], b: Edition['phase']) => {
	//         if ((a !== 'COMPLETE' && a !== 'UPCOMING') && (b === 'COMPLETE' || b === 'UPCOMING')) return -1;
	//         if ((a === 'COMPLETE' || a === 'UPCOMING') && (b !== 'COMPLETE' && b !== 'UPCOMING')) return 1;
	//         // if ((a.phase !== 'COMPLETE' && a.phase !== 'UPCOMING') && (b.phase === 'COMPLETE' || b.phase === 'UPCOMING')) return -1;
	//         // if ((a.phase === 'COMPLETE' || a.phase === 'UPCOMING') && (b.phase !== 'COMPLETE' && b.phase !== 'UPCOMING')) return 1;
	//         // if (a.votingDeadline && b.votingDeadline) return b.votingDeadline - a.votingDeadline;
	//     })
	// }

	return (
		<Card className="mb-4 py-6">
			<CardHeader>
				<CardTitle>Editions</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{editions && editions.length === 0 ? (
					<Alert>
						<AlertTitle>No editions yet</AlertTitle>
						<AlertDescription>
							{(currentUser as User).id === contest.hostId
								? `This contest hasn't got any editions yet! Create one by clicking the button above`
								: `This contest hasn't got any editions yet! Ask the host to create one and check back later`}
						</AlertDescription>
					</Alert>
				) : (
					editions &&
					editions.map((edition, index) => (
						<div key={edition.editionId}>
							<div
								className={`p-3 rounded-lg border cursor-pointer transition-colors border-border hover:bg-muted/50`}
								onClick={() => dispatch(setEdition(edition.editionId as string))}
							>
								<div className="flex items-center justify-between mb-2">
									<h4 className="font-medium">{edition.name}</h4>
									<div className="flex items-center gap-2">
										<Badge
											variant={edition.phase === 'SUBMISSION' ? 'default' : edition.phase === 'VOTING' ? 'secondary' : 'destructive'}
											className="text-xs"
										>
											{edition.phase && edition.phase.charAt(0).toUpperCase() + edition.phase.slice(1)}
										</Badge>
									</div>
								</div>
								<div className="flex items-center justify-between text-sm text-muted-foreground">
									<span>{edition.phase && getPhaseMessage(edition.phase)}</span>
									<span> {`${contest.participants?.length} ${contest.participants?.length === 1 ? 'participant' : 'participants'}`}</span>
								</div>
							</div>
							{index < sortedEditions.length - 1 && <Separator className="my-3" />}
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
};

export default EditionList;
