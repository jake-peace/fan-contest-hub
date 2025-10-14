'use client';

import { useEffect, useState, useTransition } from 'react';
import { Vote, Music, Undo2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Schema } from '../../../amplify/data/resource';
import { AuthUser } from 'aws-amplify/auth';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortableSong from './SortableSong';
import { fetchEdition } from '../EditionDetails';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { submitRanking } from '@/app/actions/submitRanking';
import { Spinner } from '../ui/spinner';

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

interface VotingComponentProps {
	editionId: string;
	user: AuthUser;
}

type Submission = Schema['Submission']['type'];
type Vote = Schema['Vote']['type'];

// export const fetchEditionVotes = async (id: string) => {
// 	const response = await fetch(`/api/editions/${id}/votes`);

// 	if (!response.ok) {
// 		throw new Error('Failed to fetch data from the server.');
// 	}

// 	const result = await response.json();
// 	return result.votes as Vote[];
// };

const VotingComponent: React.FC<VotingComponentProps> = ({ editionId, user }) => {
	const [rankings, setRankings] = useState<Submission[]>([]);
	const router = useRouter();

	const {
		data: edition,
		isLoading,
		isFetched,
	} = useQuery({
		queryKey: ['editionDetailsVoting', editionId],
		queryFn: () => fetchEdition(editionId),
	});

	useEffect(() => {
		if (isFetched) {
			if (edition?.phase !== 'VOTING') {
				router.push(`/edition/${editionId}`);
				toast.error('Voting is not open for this edition.');
			} else if (edition.rankingsList?.find((r) => r.userId === user.userId) !== undefined) {
				router.push(`/edition/${editionId}`);
				toast.error('You have already voted in this edition.');
			} else {
				setRankings(
					(edition?.submissionList as Submission[])
						.filter((s) => s.rejected !== true && s.userId !== user.userId)
						.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number)) as Submission[]
				);
			}
		}
	}, [isFetched]);

	const handleResetRankings = () => {
		setRankings(
			(edition?.submissionList as Submission[])
				.filter((s) => s.rejected !== true && s.userId !== user.userId)
				.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number)) as Submission[]
		);
	};

	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();

	const getPointsByRank = (rank: number): number | undefined => {
		return rankingPoints.get(rank);
	};

	const handleSubmitRanking = async () => {
		startTransition(async () => {
			const rankingList = rankings.map((r) => r.submissionId).slice(0, 10);
			const result = await submitRanking(rankingList, editionId);
			if (result.success) {
				// query client - invalidate future ranking query
				queryClient.invalidateQueries({ queryKey: ['editionDetails', editionId] });
				toast.success('Your votes have been submitted successfully!');
				router.push(`/edition/${editionId}`);
			} else {
				toast.error(`There was an error submitting your votes: ${result.error}`);
			}
		});
	};

	// const handleSubmitVote = async () => {
	// 	startTransition(async () => {
	// 		const result = await submitVotes(rankings.map((r) => r.submissionId).slice(0, 10), editionId);
	// 		if (result.success) {
	// 			queryClient.removeQueries({ queryKey: ['editionDetailsVotes'] });
	// 			toast.success('Your votes have been submitted successfully!');
	// 			router.push(`/edition/${editionId}`);
	// 			// Handle success UI (e.g., toast, revalidation)
	// 		} else {
	// 			// Handle error UI
	// 		}
	// 	});
	// };

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

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setRankings((items) => {
				const oldIndex = items.findIndex((item) => item.submissionId === active.id);
				const newIndex = items.findIndex((item) => item.submissionId === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	return (
		<>
			<Card className="mb-4 py-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Vote className="w-5 h-5" />
						Rank Your Top 10
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<Music className="w-4 h-4" />
						<AlertDescription>Listen to songs and drag them to create your top 10 ranking. Higher ranks get more points!</AlertDescription>
					</Alert>
					<Button onClick={handleResetRankings} variant="secondary" className="mt-2">
						<Undo2 className="w-4 h-4 mr-2" />
						Reset Rankings
					</Button>
				</CardContent>
			</Card>

			<Card className="mb-6 py-6">
				<CardHeader>
					<CardTitle>Entries</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{isFetched && rankings.length === 0 && (
						<Alert>
							<AlertTitle>No entries found</AlertTitle>
							<AlertDescription>Something went wrong fetching the entries</AlertDescription>
						</Alert>
					)}
					{isLoading ? (
						<>
							<Skeleton>
								<div className="p-3 bg-muted rounded-lg">
									<Skeleton className="w-50 h-5" />
								</div>
							</Skeleton>
							<Skeleton>
								<div className="p-3 bg-muted rounded-lg">
									<Skeleton className="w-50 h-5" />
								</div>
							</Skeleton>
						</>
					) : (
						<DndContext onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
							<SortableContext items={rankings.map((item) => item.submissionId)} strategy={verticalListSortingStrategy}>
								{rankings.map((song) => (
									<SortableSong key={song.submissionId} id={song.submissionId}>
										<div
											key={song.submissionId}
											className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border`}
										>
											<div className="flex items-center justify-between gap-3">
												<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
													<Image
														src={`https://flagcdn.com/w640/${song.flag?.toLowerCase()}.png`}
														fill
														alt={`${song.artistName}'s flag`}
														style={{ objectFit: 'cover', objectPosition: 'center' }}
														quality={80}
														sizes="640px"
													/>
												</div>
												<div className="flex-1 truncate">
													<h3 className="font-medium truncate no-select">{song.songTitle}</h3>
													<p className="text-sm text-muted-foreground truncate no-select">by {song.artistName}</p>
												</div>
												<div className="flex items-center gap-2 no-select">
													<Badge variant="secondary" className={getBadgeColor(rankings.indexOf(song) + 1)}>
														{getPointsByRank(rankings.indexOf(song) + 1)}
													</Badge>
												</div>
											</div>
										</div>
									</SortableSong>
								))}
							</SortableContext>
						</DndContext>
					)}
				</CardContent>
			</Card>

			<Button onClick={handleSubmitRanking} disabled={rankings.length === 0 || isPending} className="w-full">
				{isPending ? <Spinner /> : <Vote />}
				Submit Votes
			</Button>
		</>
	);
};

export default VotingComponent;
