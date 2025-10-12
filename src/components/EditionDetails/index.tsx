'use client';

import { Clock, Vote, Users, Music, Trophy, Upload, Play, Music2, CheckCircle, TriangleAlert, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { EditionPhase } from '@/mockData/newMockData';
import { formatDate, getPhaseMessage } from '@/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { Schema } from '../../../amplify/data/resource';
import { Progress } from '../ui/progress';
import { AuthUser } from 'aws-amplify/auth';
import { compareAsc, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';
import SubmissionCard from '../SubmissionCard';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import EditionHostOptions from '../EditionHostOptions';
import { fetchEditionVotes } from '../VotingComponent';
import { getPhaseColor } from '../EditionList';
import Image from 'next/image';

interface EditionDetailsProps {
	editionId: string;
	user: AuthUser;
}

type Edition = Schema['Edition']['type'];
type Contest = Schema['Contest']['type'];
type Submission = Schema['Submission']['type'];
type Vote = Schema['Vote']['type'];

export interface ExpandedEdition extends Edition {
	fulfilledContest: Contest;
	fulfilledSubmissions: Submission[];
}

export const fetchEdition = async (id: string) => {
	const response = await fetch(`/api/editions/${id}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.edition as ExpandedEdition;
};

const EditionDetails: React.FC<EditionDetailsProps> = ({ editionId, user }) => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const {
		data: edition,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery({
		queryKey: ['editionDetails', editionId],
		queryFn: () => fetchEdition(editionId),
	});

	const { data: editionVotes } = useQuery({
		queryKey: ['editionDetailsVotes', editionId],
		queryFn: () => fetchEditionVotes(editionId),
		enabled: edition && (edition.phase === 'VOTING' || edition.phase === 'RESULTS'),
	});

	useEffect(() => {
		const song = searchParams.get('song');
		if (song) {
			toast.success(`Your song ${song} was submitted successfully. Good luck!`);
			router.replace(`/edition/${editionId}`);
		}
	}, [searchParams]); // Reruns when query params change

	const hasUserSubmitted = (): boolean => {
		return edition?.fulfilledSubmissions.find((s) => s.userId === user.userId && s.rejected !== true) !== undefined;
	};

	const userSubmission = (): Submission => {
		return edition?.fulfilledSubmissions.find((s) => s.userId === user.userId && s.rejected !== true) as Submission;
	};

	const hasUserVoted = (): boolean => {
		return editionVotes?.find((v) => v.fromUserId === user.userId) !== undefined;
	};

	const wasEntryRejected = (): boolean => {
		return (
			edition?.fulfilledSubmissions.find((s) => s.userId === user.userId && s.rejected === true) !== undefined &&
			edition?.fulfilledSubmissions.find((s) => s.userId === user.userId && s.rejected !== true) === undefined
		);
	};

	const getPhaseIcon = (phase: EditionPhase) => {
		switch (phase) {
			case 'UPCOMING':
				return <Clock className="w-3 h-3" />;
			case 'SUBMISSION':
				return <Music className="w-3 h-3" />;
			case 'VOTING':
				return <Vote className="w-3 h-3" />;
			case 'RESULTS':
				return <Trophy className="w-3 h-3" />;
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
						Song Submitted
					</Button>
				) : (
					<Button onClick={() => router.push(`/edition/${editionId}/submit`)} className="w-full">
						<Upload className="w-4 h-4 mr-2" />
						Submit Your Song
					</Button>
				);
			}

			if (edition.phase === 'VOTING') {
				return (
					<>
						{edition.fulfilledSubmissions.some((s) => s.userId === user.userId) === undefined && (
							<Alert>
								<AlertTitle>
									<Info />
									As you haven&apos;t submitted a song, your votes will be added to the televote instead of the jury.
								</AlertTitle>
							</Alert>
						)}
						{hasUserVoted() ? (
							<Button disabled={true} className="w-full bg-(--success)">
								<CheckCircle className="w-4 h-4 mr-2" />
								Votes Submitted
							</Button>
						) : (
							<Button onClick={() => router.push(`/edition/${editionId}/vote`)} className="w-full">
								<Vote className="w-4 h-4 mr-2" />
								Vote Now
							</Button>
						)}
					</>
				);
			}

			if (edition.phase === 'RESULTS' || edition.phase === 'COMPLETE') {
				return (
					editionVotes && (
						<Button className="w-full" onClick={() => router.push(`/edition/${editionId}/results`)}>
							<Trophy className="w-4 h-4 mr-2" />
							View Results
						</Button>
					)
				);
			}

			return null;
		}
	};

	if (isLoading) {
		return (
			<>
				<Card className="mb-4 py-6">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Skeleton className="w-50 h-5" />
							</CardTitle>
						</div>
						<Skeleton className="w-50 h-5" />
					</CardHeader>
					<CardContent>
						<Skeleton>
							<div className="p-3 bg-muted rounded-lg">
								<Skeleton className="w-50 h-5" />
							</div>
						</Skeleton>
					</CardContent>
				</Card>
			</>
		);
	}

	return (
		edition && (
			<>
				{edition && edition.phase === 'UPCOMING' && compareAsc(parseISO(edition.submissionsOpen as string), new Date()) === -1 && (
					<Alert className="mb-2">
						<Info />
						<AlertDescription>
							It looks like submissions haven&apos;t opened themselves up. Sometimes this takes up to 15 minutes, after this, refresh the
							page and try again.
						</AlertDescription>
					</Alert>
				)}
				<Card className="mb-4 py-6 gap-2">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">{edition.name}</CardTitle>
							{edition.phase && (
								<Badge className={`text-xs bg-(--${getPhaseColor(edition.phase)}`}>
									{getPhaseIcon(edition.phase)}
									<span className="ml-1 capitalize">{edition.phase}</span>
								</Badge>
							)}
						</div>
						<p className="text-muted-foreground">{edition.description}</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-2 text-sm">
							{wasEntryRejected() && edition.phase === 'SUBMISSION' && (
								<Alert className="bg-(--destructive)">
									<AlertTitle className="flex items-center gap-2">
										<TriangleAlert />
										Resubmit your song
									</AlertTitle>
									<AlertDescription>Your song was rejected by the contest host.</AlertDescription>
								</Alert>
							)}
							{edition.submissionsOpen && edition.phase === 'UPCOMING' && (
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Play className="w-4 h-4" />
										Submissions open from
									</span>
									<span>{formatDate(edition.submissionsOpen)}</span>
								</div>
							)}
							{edition.submissionDeadline && edition.closeSubmissionType === 'specificDate' && (
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Clock className="w-4 h-4" />
										Submission Due
									</span>
									<span>{formatDate(edition.submissionDeadline)}</span>
								</div>
							)}
							{edition.votingDeadline && edition.closeVotingType === 'specificDate' && (
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
							{edition.fulfilledContest?.participants && (
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Users className="w-4 h-4" />
										Participants
									</span>
									<span>{edition.fulfilledContest.participants.length}</span>
								</div>
							)}

							{edition.phase === 'SUBMISSION' && edition.fulfilledContest.participants && (
								<div className="space-y-1">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2">
											<Music2 className="w-4 h-4" />
											Submissions
										</span>
										<span>
											{edition.fulfilledSubmissions.filter((s) => s.rejected !== true).length}/
											{edition.fulfilledContest.participants.length}
										</span>
									</div>
									<Progress
										value={
											(edition.fulfilledSubmissions.filter((s) => s.rejected !== true).length /
												edition.fulfilledContest.participants.length) *
											100
										}
										className="h-2"
									/>
								</div>
							)}

							{edition.phase === 'VOTING' && edition.fulfilledContest.participants && editionVotes && (
								<div className="space-y-1">
									<div className="flex justify-between">
										<span>Votes Cast</span>
										<span>
											{editionVotes.length / Math.min(10, edition.fulfilledSubmissions.length - 1)}/
											{edition.fulfilledContest.participants.length}
										</span>
									</div>
									<Progress value={(0 / edition.fulfilledContest.participants.length) * 100} className="h-2" />
								</div>
							)}
						</div>

						<div className="p-3 bg-muted rounded-lg">
							<p className="text-center">{getPhaseMessage(edition.phase)}</p>
						</div>

						{edition && getActionButton()}

						{edition.spotifyPlaylistLink && (edition.phase === 'VOTING' || edition.phase === 'RESULTS') && (
							<Button
								className="w-full relative hover:bg-muted"
								variant="outline"
								onClick={() => window.open(edition.spotifyPlaylistLink as string)}
							>
								<Image src={`/spotifyLogo.svg`} width={20} height={20} alt={`spotifyLogoBlack`} quality={80} sizes="640px" />
								Listen on Spotify
							</Button>
						)}

						{user.userId === edition.fulfilledContest.hostId && (
							<EditionHostOptions phase={edition.phase} onRefetch={refetch} editionId={editionId} />
						)}
					</CardContent>
				</Card>

				{edition.phase === 'SUBMISSION' && hasUserSubmitted() ? (
					<Card className="mb-4 py-6 gap-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">Your Submission</CardTitle>
						</CardHeader>
						<CardContent>
							<SubmissionCard
								submission={userSubmission()}
								isHost={false}
								onReject={refetch}
								contestId={edition.fulfilledContest.contestId as string}
							/>
						</CardContent>
					</Card>
				) : (
					<Card className="mb-4 py-6 gap-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">Your Submission</CardTitle>
						</CardHeader>
						<CardContent>
							<Skeleton className="rounded-xl">
								<Card className="p-4 bg-muted">
									<div>You haven&apos;t submitted yet</div>
								</Card>
							</Skeleton>
						</CardContent>
					</Card>
				)}

				{edition.phase === 'VOTING' ||
					(edition.phase === 'SUBMISSION' && edition.fulfilledContest.hostId === user.userId && (
						<Card className="mb-4 py-6 gap-2">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">Submissions</CardTitle>
							</CardHeader>
							<CardContent className="space-y-1">
								{/* List of submissions, in running order */}
								{isRefetching ? (
									<Skeleton>
										<Card className="p-4 bg-muted" />
									</Skeleton>
								) : (
									edition.fulfilledSubmissions
										.filter((s) => s.rejected !== true)
										.map((s) => (
											<SubmissionCard
												key={s.submissionId}
												submission={s}
												onReject={refetch}
												isHost={user.userId === edition.fulfilledContest.hostId}
												contestId={edition.fulfilledContest.contestId as string}
											/>
										))
								)}
							</CardContent>
						</Card>
					))}

				{edition.phase === 'RESULTS' && !edition.resultsRevealed && (
					<Alert>
						<Info />
						<AlertDescription>Results will be available here after the host has revealed them.</AlertDescription>
					</Alert>
				)}
			</>
		)
	);
};

export default EditionDetails;
