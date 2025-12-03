import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Schema } from '../../../amplify/data/resource';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { compareDesc, formatDistanceToNow, parseISO } from 'date-fns';
import { CircleAlert, CircleCheck, Send, Trophy, Vote } from 'lucide-react';
import { SelectionSet } from 'aws-amplify/api';

interface EditionListProps {
	contestId: string;
	user: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const selectionSet = [
	'name',
	'description',
	'participants',
	'joinCode',
	'hostId',
	'editions.editionId',
	'editions.phase',
	'editions.submissionsOpen',
	'editions.closeSubmissionType',
	'editions.submissionDeadline',
	'editions.closeVotingType',
	'editions.votingDeadline',
	'editions.name',
	'editions.rankings.userId',
	'editions.submissions.userId',
] as const;
type Contest = SelectionSet<Schema['Contest']['type'], typeof selectionSet>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const editionSelectionSet = [
	'editionId',
	'phase',
	'submissionsOpen',
	'closeSubmissionType',
	'submissionDeadline',
	'closeVotingType',
	'votingDeadline',
	'submissions.userId',
	'rankings.userId',
] as const;
type Edition = SelectionSet<Schema['Edition']['type'], typeof editionSelectionSet>;

const fetchContestEditions = async (contestId: string) => {
	const response = await fetch(`/api/contest/${contestId}/editions`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.contest as Contest; // Return the clean data
};

export const getPhaseColor = (phase: string) => {
	switch (phase) {
		case 'UPCOMING':
			return `customc`;
		case 'SUBMISSION':
			return 'customb';
		case 'VOTING':
			return 'customa';
		case 'RESULTS':
			return 'customb';
		default:
			return 'custome';
	}
};

const getPhaseIcon = (phase: string) => {
	switch (phase) {
		case 'SUBMISSION':
			return <Send />;
		case 'VOTING':
			return <Vote />;
		case 'RESULTS':
			return <Trophy />;
		default:
			return undefined;
	}
};

const EditionList: React.FC<EditionListProps> = ({ contestId, user }) => {
	const router = useRouter();

	// const currentUser = useAppSelector((state) => state.user.user);

	const { data: contest, isLoading } = useQuery({
		queryKey: ['contestEditionList', contestId],
		queryFn: () => fetchContestEditions(contestId as string),
	});

	const getPhaseStatus = (edition: Edition) => {
		switch (edition.phase) {
			case 'UPCOMING':
				return `Submissions open in ${formatDistanceToNow(edition.submissionsOpen as string)}`;
			case 'SUBMISSION':
				if (edition.closeSubmissionType === 'specificDate') {
					return `${formatDistanceToNow(edition.submissionDeadline as string)} left to submit`;
				} else {
					return 'Waiting for submissions';
				}
			case 'VOTING':
				if (edition.closeVotingType === 'specificDate') {
					return `${formatDistanceToNow(edition.votingDeadline as string)} left to vote`;
				} else {
					return 'Voting is open!';
				}
			default:
				return 'Results available!';
		}
	};

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
				) : contest && contest.editions.length === 0 ? (
					<Alert>
						<AlertTitle>No editions yet</AlertTitle>
						<AlertDescription>
							{user === contest.hostId
								? `This contest hasn't got any editions yet! Create one by clicking the button above`
								: `This contest hasn't got any editions yet! Ask the host to create one and check back later`}
						</AlertDescription>
					</Alert>
				) : (
					contest &&
					contest.editions
						.sort((a, b) => compareDesc(parseISO(a.submissionsOpen as string), parseISO(b.submissionsOpen as string)))
						.map((edition) => (
							<div key={edition.editionId}>
								<div
									className={`p-2 rounded-lg border cursor-pointer transition-colors border-border hover:bg-muted/50`}
									onClick={() => router.push(`/edition/${edition.editionId}`)}
								>
									<div className="flex items-center justify-between mb-2">
										<h4 className="font-medium">{edition.name}</h4>
										<div className="flex items-center gap-2">
											{edition.phase && (
												<Badge variant="default" className={`text-xs bg-(--customa) flex gap-1 items-center`}>
													{getPhaseIcon(edition.phase)}
													{edition.phase}
												</Badge>
											)}
										</div>
									</div>
									<div className="flex items-center justify-between text-sm text-muted-foreground">
										<span>{edition.phase && getPhaseStatus(edition)}</span>
									</div>
									{edition.phase === 'VOTING' && (
										<Alert className="mt-1">
											<AlertTitle className="flex gap-2 items-center">
												{edition.rankings.some((rank) => rank.userId === user) ? <CircleCheck /> : <CircleAlert />}
												{edition.rankings.some((rank) => rank.userId === user) ? 'Voted!' : `You haven't voted yet`}
											</AlertTitle>
										</Alert>
									)}
									{edition.phase === 'SUBMISSION' && (
										<Alert className="mt-1">
											<AlertTitle className="flex gap-2 items-center">
												{edition.submissions.some((song) => song.userId === user) ? <CircleCheck /> : <CircleAlert />}
												{edition.submissions.some((song) => song.userId === user) ? 'Song Submitted!' : `You haven't submitted a song yet`}
											</AlertTitle>
										</Alert>
									)}
								</div>
							</div>
						))
				)}
			</CardContent>
		</Card>
	);
};

export default EditionList;
