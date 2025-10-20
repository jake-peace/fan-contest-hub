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
import { getPhaseColor } from '../EditionList';
import Image from 'next/image';
import { EditionWithDetails } from '@/types/Edition';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { SubmissionWithScore } from '../ResultsComponent';
import { fetchSavedRanking } from '../VotingComponent';

interface EditionDetailsProps {
	editionId: string;
	user: AuthUser;
}

const rankingPoints = new Map<number, number>([
	[1, 12],
	[2, 10],
	[3, 8],
	[4, 7],
	[5, 6],
	[6, 5],
	[7, 4],
	[8, 3],
	[9, 2],
	[10, 1],
]);

type Submission = Schema['Submission']['type'];
type Vote = Schema['Vote']['type'];

export const fetchEdition = async (id: string) => {
	const response = await fetch(`/api/editions/${id}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.edition as EditionWithDetails;
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

	const { data: savedRanking } = useQuery({
		queryKey: ['editionDetailsSavedRanking', editionId],
		queryFn: () => fetchSavedRanking(editionId),
	});

	useEffect(() => {
		const song = searchParams.get('song');
		if (song) {
			toast.success(`Your song ${song} was submitted successfully. Good luck!`);
			router.replace(`/edition/${editionId}`);
		}
	}, [searchParams]); // Reruns when query params change

	const hasUserSubmitted = (): boolean => {
		if (!edition?.submissionList) {
			return false;
		}
		return edition?.submissionList.find((s) => s.userId === user.userId && s.rejected !== true) !== undefined;
	};

	const userSubmission = (): Submission => {
		return (edition?.submissionList as Submission[]).find((s) => s.userId === user.userId && s.rejected !== true) as Submission;
	};

	const hasUserVoted = (): boolean => {
		return edition?.rankingsList?.find((r) => r.userId === user.userId) !== undefined;
	};

	const wasEntryRejected = (): boolean => {
		return (
			(edition?.submissionList as Submission[]).find((s) => s.userId === user.userId && s.rejected === true) !== undefined &&
			(edition?.submissionList as Submission[]).find((s) => s.userId === user.userId && s.rejected !== true) === undefined
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
					<Button className="w-full bg-(--success)">
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
						{edition.submissionList?.some((s) => s.userId === user.userId) === undefined && (
							<Alert>
								<AlertTitle>
									<Info />
									As you haven&apos;t submitted a song, your votes will be added to the televote instead of the jury.
								</AlertTitle>
							</Alert>
						)}
						{hasUserVoted() ? (
							<Button className="w-full bg-(--success)">
								<CheckCircle className="w-4 h-4 mr-2" />
								Votes Submitted
							</Button>
						) : (
							<Button onClick={() => router.push(`/edition/${editionId}/vote`)} className="w-full">
								<Vote className="w-4 h-4 mr-2" />
								Vote Now
							</Button>
						)}
						{savedRanking !== null && !hasUserVoted() && (
							<Alert className="mt-1">
								<AlertTitle className="flex items-center gap-2">
									<Info />
									You have a saved ranking but haven&apos;t submitted yet
								</AlertTitle>
							</Alert>
						)}
					</>
				);
			}

			if (edition.phase === 'RESULTS' || edition.phase === 'COMPLETE') {
				return (
					edition.rankingsList && (
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

	const getBadgeColor = (rank: number) => {
		if (rank > 10) {
			return 'bg-(--destructive)';
		}
		switch (rank) {
			case 1:
				return 'bg-(--gold) text-[black]';
			case 2:
				return 'bg-(--silver) text-[black]';
			case 3:
				return 'bg-(--bronze) text-[black]';
			default:
				return '';
		}
	};

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
							{edition.contestDetails.participants && (
								<div className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Users className="w-4 h-4" />
										Participants
									</span>
									<span>{edition.contestDetails.participants.length}</span>
								</div>
							)}

							{edition.phase === 'SUBMISSION' && edition.contestDetails.participants && (
								<div className="space-y-1">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2">
											<Music2 className="w-4 h-4" />
											Submissions
										</span>
										<span>
											{edition.submissionList?.filter((s) => s.rejected !== true).length}/{edition.contestDetails.participants.length}
										</span>
									</div>
									<Progress
										value={
											((edition.submissionList as Submission[]).filter((s) => s.rejected !== true).length /
												edition.contestDetails.participants.length) *
											100
										}
										className="h-2"
									/>
								</div>
							)}

							{edition.phase === 'VOTING' && edition.contestDetails.participants && edition.rankingsList && (
								<div className="space-y-1">
									<div className="flex justify-between">
										<span>Votes Cast</span>
										<span>
											{edition.rankingsList.length}/{edition.contestDetails.participants.length}
										</span>
									</div>
									<Progress value={(edition.rankingsList.length / edition.contestDetails.participants.length) * 100} className="h-2" />
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

						{user.userId === edition.contestDetails.hostId && (
							<EditionHostOptions
								phase={edition.phase}
								onRefetch={refetch}
								editionId={editionId}
								submissions={edition.submissionList}
								televote={edition.televoteId !== null}
							/>
						)}
					</CardContent>
				</Card>

				{edition.phase === 'SUBMISSION' && hasUserSubmitted() ? (
					<Card className="mb-4 py-6 gap-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">Your Submission</CardTitle>
						</CardHeader>
						<CardContent>
							{isRefetching ? (
								<Skeleton>
									<Card className="p-4 bg-muted" />
								</Skeleton>
							) : (
								<SubmissionCard
									submission={userSubmission()}
									isHost={false}
									onReject={refetch}
									contestId={edition.contestDetails.contestId as string}
									isUser
								/>
							)}
						</CardContent>
					</Card>
				) : (
					edition.phase === 'SUBMISSION' && (
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
					)
				)}

				{edition.phase === 'VOTING' && (
					<>
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
									(edition.submissionList as Submission[])
										.filter((s) => s.rejected !== true)
										.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))
										.map((s) => (
											<SubmissionCard
												key={s.submissionId}
												submission={s}
												isHost={false}
												contestId={edition.contestDetails.contestId as string}
												showRunningOrder
												isUser={false}
											/>
										))
								)}
							</CardContent>
						</Card>
						<Card className="mb-4 py-6 gap-2">
							<Collapsible>
								<CardHeader>
									<CollapsibleTrigger>
										<CardTitle className="flex items-center gap-2">View Your Votes</CardTitle>
									</CollapsibleTrigger>
								</CardHeader>
								<CardContent className="space-y-1">
									<CollapsibleContent>
										{edition.rankingsList?.find((x) => x.userId === user.userId) !== undefined ? (
											edition.rankingsList
												?.find((r) => r.userId === user.userId)
												?.rankingList?.map((s, index) => (
													<div key={s} className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border`}>
														<div className="flex items-center justify-between gap-3">
															<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
																<Image
																	src={`https://flagcdn.com/w640/${edition.submissionList?.find((a) => a.submissionId === s)?.flag?.toLowerCase()}.png`}
																	fill
																	alt={`${edition.submissionList?.find((a) => a.submissionId === s)?.countryName}'s flag`}
																	style={{ objectFit: 'cover', objectPosition: 'center' }}
																	quality={80}
																	sizes="640px"
																/>
															</div>
															<div className="flex-1 truncate">
																<h3 className="font-medium truncate">
																	{edition.submissionList?.find((a) => a.submissionId === s)?.songTitle}
																</h3>
																<p className="text-sm text-muted-foreground truncate">
																	by {edition.submissionList?.find((a) => a.submissionId === s)?.artistName}
																</p>
															</div>
															<div className="flex items-center gap-2">
																<Badge variant="secondary" className={getBadgeColor(index + 1)}>
																	{rankingPoints.get(index + 1)}
																</Badge>
															</div>
														</div>
													</div>
												))
										) : (
											<Alert>
												<AlertTitle>You haven&apos;t voted yet</AlertTitle>
											</Alert>
										)}
									</CollapsibleContent>
								</CardContent>
							</Collapsible>
						</Card>
					</>
				)}

				{edition.phase === 'SUBMISSION' && edition.contestDetails.hostId === user.userId && (
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
								(edition.submissionList as Submission[])
									.filter((s) => s.rejected !== true)
									.map((s) => (
										<SubmissionCard
											key={s.submissionId}
											submission={s}
											onReject={refetch}
											isHost={user.userId === edition.contestDetails.hostId}
											contestId={edition.contestDetails.contestId as string}
										/>
									))
							)}
						</CardContent>
					</Card>
				)}

				{edition.phase === 'RESULTS' && !edition.resultsRevealed && (
					<Alert>
						<Info />
						<AlertDescription>Results will be available here after the host has revealed them.</AlertDescription>
					</Alert>
				)}

				{edition.phase === 'RESULTS' && edition.resultsRevealed && (
					<Card className="mb-4 py-6 gap-2">
						<Collapsible>
							<CardHeader>
								<CollapsibleTrigger>
									<CardTitle className="flex items-center gap-2">View Scoreboard</CardTitle>
								</CollapsibleTrigger>
							</CardHeader>
							<CardContent>
								<CollapsibleContent>
									{(edition.submissionList as SubmissionWithScore[]).map((song, index) => (
										<div
											key={song.submissionId}
											className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border mb-1`}
										>
											<div className="flex items-center justify-between gap-3">
												<div className="flex items-center gap-2">
													<Badge variant="secondary" className={getBadgeColor(index + 1)}>
														{index + 1}
													</Badge>
												</div>
												<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
													<Image
														src={`https://flagcdn.com/w640/${song.flag?.toLowerCase()}.png`}
														fill
														alt={`${song.countryName}'s flag`}
														style={{ objectFit: 'cover', objectPosition: 'center' }}
														quality={80}
														sizes="640px"
													/>
												</div>
												<div className="flex-1 truncate">
													<h3 className="font-medium truncate">{song?.songTitle}</h3>
													<p className="text-sm text-muted-foreground truncate">by {song?.artistName}</p>
												</div>
												<div
													className={`text-lg text-white p-2 rounded-md min-w text-center flex items-center justify-center bg-[#2196f3]`}
													style={{ width: 40, height: 30, fontWeight: 'bold' }}
												>
													{song.score}
												</div>
											</div>
										</div>
									))}
								</CollapsibleContent>
							</CardContent>
						</Collapsible>
					</Card>
				)}
			</>
		)
	);
};

export default EditionDetails;
