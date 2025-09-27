import { Clock, Vote, Users, Share, Crown, Music, Trophy, Upload, Play, Music2, CheckCircle, LucideCroissant } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { EditionPhase } from '@/mockData/newMockData';
import { formatDate, getPhaseMessage } from '@/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useAmplifyClient } from '@/app/amplifyConfig';
import { Schema } from '../../../amplify/data/resource';
import { Progress } from '../ui/progress';
import { getCurrentUser } from 'aws-amplify/auth';
import { closeSubmissions, closeVoting } from '@/utils/APIUtils';

interface EditionDetailsProps {
	edition: Edition;
	contest: Contest;
	submissions: Submission[];
	onSubmitSong: () => void;
	onVote: () => void;
	onResults: () => void;
}

type Edition = Schema['Edition']['type'];
type Contest = Schema['Contest']['type'];
type Submission = Schema['Submission']['type'];

const EditionDetails: React.FC<EditionDetailsProps> = ({ edition, submissions, contest, onSubmitSong, onVote, onResults }) => {
	const client = useAmplifyClient();
	const queryClient = useQueryClient();

	const hasUserSubmitted = (): boolean => {
		return submissions.find(async (s) => s.userId === (await getCurrentUser()).userId) !== undefined;
	};

	const getPhaseColor = (phase: string) => {
		switch (phase) {
			case 'submission':
				return 'default';
			case 'voting':
				return 'secondary';
			case 'results':
				return 'destructive';
			default:
				return 'default';
		}
	};

	const getPhaseIcon = (phase: EditionPhase) => {
		switch (phase) {
			case 'UPCOMING':
				return <Clock className="w-3 h-3" />;
			case 'SUBMISSION':
				return <Music className="w-3 h-3" />;
			case 'VOTING':
				return <Users className="w-3 h-3" />;
			case 'RESULTS':
				return <Trophy className="w-3 h-3" />;
			case 'COMPLETE':
				return <Crown className="w-3 h-3" />;
			default:
				return <Music className="w-3 h-3" />;
		}
	};

	const getActionButton = () => {
		if (edition) {
			if (edition.phase === 'SUBMISSION') {
				return hasUserSubmitted() ? (
					<Button disabled={true} className="w-full bg-(--success)">
						<CheckCircle className="w-4 h-4 mr-2" />
						Already Submitted
					</Button>
				) : (
					<Button onClick={onSubmitSong} className="w-full">
						<Upload className="w-4 h-4 mr-2" />
						Submit Your Song
					</Button>
				);
			}

			if (edition.phase === 'VOTING') {
				return (
					<Button
						onClick={() => {
							onVote();
							queryClient.removeQueries({ queryKey: ['resultsQuery'] });
						}}
						className="w-full"
					>
						<Vote className="w-4 h-4 mr-2" />
						Vote Now
					</Button>
				);
			}

			if (edition.phase === 'RESULTS' || edition.phase === 'COMPLETE') {
				return (
					<Button onClick={onResults} className="w-full">
						<Trophy className="w-4 h-4 mr-2" />
						View Results
					</Button>
				);
			}

			return null;
		}
	};

	return (
		<>
			{edition && (
				<Card className="mb-4 py-6">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">{edition.name}</CardTitle>
							{edition.phase && (
								<Badge variant={getPhaseColor(edition.phase)} className="text-xs bg-blue-500 text-white dark:bg-blue-600">
									{getPhaseIcon(edition.phase)}
									<span className="ml-1 capitalize">{edition.phase}</span>
								</Badge>
							)}
						</div>
						<p className="text-muted-foreground">{edition.description}</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-2 text-sm">
							{edition.submissionsOpen && (
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Play className="w-4 h-4" />
										Submissions open from
									</span>
									<span>{formatDate(edition.submissionsOpen)}</span>
								</div>
							)}
							{edition.submissionDeadline && (
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Clock className="w-4 h-4" />
										Submission Due
									</span>
									<span>{formatDate(edition.submissionDeadline)}</span>
								</div>
							)}
							{edition.votingDeadline && (
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Vote className="w-4 h-4" />
										Voting Due
									</span>
									<span>{formatDate(edition.votingDeadline)}</span>
								</div>
							)}
						</div>

						<div className="space-y-2">
							{contest?.participants && (
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Users className="w-4 h-4" />
										Participants
									</span>
									<span>{contest.participants.length}</span>
								</div>
							)}

							{edition.phase === 'SUBMISSION' && contest?.participants && (
								<div className="space-y-1">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2">
											<Music2 className="w-4 h-4" />
											Submissions
										</span>
										<span>
											{submissions.length}/{contest.participants.length}
										</span>
									</div>
									<Progress value={(submissions.length / contest.participants.length) * 100} className="h-2" />
								</div>
							)}

							{edition.phase === 'VOTING' && contest?.participants && (
								<div className="space-y-1">
									<div className="flex justify-between">
										<span>Votes Cast</span>
										<span>
											{1}/{contest.participants.length}
										</span>
									</div>
									<Progress value={(0 / contest.participants.length) * 100} className="h-2" />
								</div>
							)}
						</div>

						<div className="p-3 bg-muted rounded-lg">
							<p className="text-center">{getPhaseMessage(edition.phase)}</p>
						</div>

						{edition && getActionButton()}

						<Button variant="outline" onClick={() => console.log('invite friends')} className="w-full">
							<Share className="w-4 h-4 mr-2" />
							Invite Friends
						</Button>

						<Button variant="destructive" onClick={() => closeSubmissions(client, edition.editionId as string)} className="w-full">
							<LucideCroissant className="w-4 h-4 mr-2" />
							Close Submissions
						</Button>

						<Button variant="destructive" onClick={() => closeVoting(client, edition.editionId as string)} className="w-full">
							<LucideCroissant className="w-4 h-4 mr-2" />
							Close Voting
						</Button>
					</CardContent>
				</Card>
			)}
		</>
	);
};

export default EditionDetails;
