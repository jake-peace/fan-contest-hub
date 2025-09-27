import { useState } from 'react';
import { Vote, Check, Music, Undo2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { useAmplifyClient } from '@/app/amplifyConfig';
import { toast } from 'sonner';
import { Schema } from '../../../amplify/data/resource';
import { Spinner } from '../ui/spinner';
import { getCurrentUser } from 'aws-amplify/auth';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortableSong from './SortableSong';

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
	edition: Edition;
	onBack: () => void;
}

type Edition = Schema['Edition']['type'];
type Submission = Schema['Submission']['type'];
type Vote = Schema['Vote']['type'];

const VotingComponent: React.FC<VotingComponentProps> = ({ edition, onBack }) => {
	const [rankings, setRankings] = useState<Submission[]>([]);
	const [hasVoted, setHasVoted] = useState(false);
	const [submissions, setSubmissions] = useState<Submission[]>([]);

	const client = useAmplifyClient();

	const getPointsByRank = (rank: number): number | undefined => {
		return rankingPoints.get(rank);
	};

	const { isLoading } = useQuery({
		queryKey: ['votingComponentEditionQuery'],
		queryFn: async () => {
			const response = await client.models.Edition.get({
				editionId: edition.editionId,
			});
			const responseData = response.data;
			if (!responseData) {
				toast.error('Edition not found');
			} else {
				const { data: submissionsResp } = await responseData.submissions();
				setSubmissions(submissionsResp);
				setRankings(submissionsResp.filter(async (song) => song.userId === (await getCurrentUser()).userId));
			}
			return responseData as unknown as Edition;
		},
	});

	if (isLoading) {
		return <Spinner />;
	}

	const handleSubmitVote = async () => {
		client.queries.submitBatchVotes({
			ranking: rankings.map((song) => song.submissionId),
			user: (await getCurrentUser()).userId,
		});
		setHasVoted(true);
		onBack();
	};

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

	if (hasVoted) {
		return (
			<div className="min-h-screen bg-background p-4">
				<div className="max-w-md mx-auto">
					<Card className="text-center">
						<CardContent className="pt-6">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Check className="w-8 h-8 text-green-600" />
							</div>
							<h2 className="mb-2">Vote Submitted!</h2>
							<p className="text-muted-foreground mb-4">Thank you for voting! Results will be revealed once everyone has voted.</p>
							<Button onClick={onBack} className="w-full">
								Back to Contest
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-md mx-auto">
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
					<Button onClick={() => setRankings(submissions)} variant="secondary" className="mt-2">
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
					<DndContext onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
						<SortableContext items={rankings.map((item) => item.submissionId)} strategy={verticalListSortingStrategy}>
							{rankings.map((song) => (
								<SortableSong key={song.submissionId} id={song.submissionId}>
									<div
										key={song.submissionId}
										className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border`}
									>
										<div className="flex items-center justify-between">
											<div className="flex-1 min-w-0">
												<h3 className="font-medium truncate">{song.songTitle}</h3>
												<p className="text-sm text-muted-foreground truncate">by {song.artistName}</p>
												<div className="flex items-center gap-2 mt-1">
													<Badge variant="outline" className="text-xs flex items-center gap-1">
														<span>{song.flag}</span>
														{song.countryName}
													</Badge>
												</div>
											</div>
											<div className="flex items-center gap-2">
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
				</CardContent>
			</Card>

			<Button onClick={handleSubmitVote} disabled={rankings.length === 0} className="w-full">
				<Vote className="w-4 h-4 mr-2" />
				Submit Rankings
			</Button>
		</div>
	);
};

export default VotingComponent;
