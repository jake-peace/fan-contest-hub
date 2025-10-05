import { sortedEditions, getPhaseMessage } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { User } from '@/types/Contest';
import { useAppSelector } from '@/app/store/hooks';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Schema } from '../../../amplify/data/resource';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

interface EditionListProps {
	contest: Contest;
}

type Contest = Schema['Contest']['type'];
type Edition = Schema['Edition']['type'];

const fetchContestEditions = async (contestId: string) => {
	// Call the secure Next.js Route Handler
	const response = await fetch(`/api/contest/${contestId}/editions`);

	if (!response.ok) {
		// TanStack Query's error boundary will catch this
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.editions as Edition[]; // Return the clean data
};

const EditionList: React.FC<EditionListProps> = ({ contest }) => {
	const router = useRouter();

	const currentUser = useAppSelector((state) => state.user.user);

	const { data: editions, isLoading } = useQuery({
		queryKey: ['contestEditionList', contest.contestId],
		queryFn: () => fetchContestEditions(contest.contestId as string),
	});

	return (
		<Card className="mb-4 py-6">
			<CardHeader>
				<CardTitle>Editions</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{isLoading ? (
					<>
						<Skeleton>
							<div className={`p-2 mb-2 rounded-lg border cursor-pointer transition-colors border-border hover:bg-muted/50 h-15`} />
						</Skeleton>
						<Skeleton>
							<div className={`p-2 rounded-lg border cursor-pointer transition-colors border-border hover:bg-muted/50 h-15`} />
						</Skeleton>
					</>
				) : editions && editions.length === 0 ? (
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
					editions.map((edition: Edition, index: number) => (
						<div key={edition.editionId}>
							<div
								className={`p-2 rounded-lg border cursor-pointer transition-colors border-border hover:bg-muted/50`}
								onClick={() => router.push(`/edition/${edition.editionId}`)}
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
