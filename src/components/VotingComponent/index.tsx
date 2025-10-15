'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Vote, Undo2, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Schema } from '../../../amplify/data/resource';
import { AuthUser } from 'aws-amplify/auth';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortableSong from './SortableSong';
import { fetchEdition } from '../EditionDetails';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { submitRanking } from '@/app/actions/submitRanking';
import { Spinner } from '../ui/spinner';
import { saveRanking } from '@/app/actions/saveRanking';

interface VotingComponentProps {
	editionId: string;
	user: AuthUser;
}

type Submission = Schema['Submission']['type'];
type Vote = Schema['Vote']['type'];
type Ranking = Schema['Ranking']['type'];
interface EmbedOptions {
	uri: string;
	width?: number | string;
	height?: number | string;
}

interface EmbedController {
	loadUri(uri: string): void;
	play(): void;
	pause(): void;
	resume(): void;
	togglePlay(): void;
	seek(seconds: number): void;
	destroy(): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	addListener(event: string, callback: (event: any) => void): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	removeListener(event: string, callback: (event: any) => void): void;
}

interface IFrameAPI {
	createController(element: HTMLElement | null, options: EmbedOptions, callback: (controller: EmbedController) => void): void;
}
declare global {
	interface Window {
		onSpotifyIframeApiReady: (IFrameAPI: IFrameAPI) => void;
	}
}

function convertPlaylistUrlToUri(url: string): string {
	const playlistRegex = /https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+).*/;
	const replacementString = 'spotify:playlist:$1';
	const uri = url.replace(playlistRegex, replacementString);

	console.log(uri);

	return uri;
}

export const fetchSavedRanking = async (id: string) => {
	const response = await fetch(`/api/editions/${id}/savedranking`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.ranking as Ranking;
};

const VotingComponent: React.FC<VotingComponentProps> = ({ editionId, user }) => {
	const [rankings, setRankings] = useState<Submission[]>([]);
	const [debouncedRankings, setDebouncedRankings] = useState(rankings);
	const router = useRouter();
	const playerDivRef = useRef<HTMLDivElement>(null);
	const [saved, setSaved] = useState(false);

	const {
		data: edition,
		isLoading,
		isFetched,
	} = useQuery({
		queryKey: ['editionDetailsVoting', editionId],
		queryFn: () => fetchEdition(editionId),
	});

	const {
		data: savedRanking,
		isLoading: loadingSaved,
		isFetched: fetchedSaved,
	} = useQuery({
		queryKey: ['savedRankingVoting', editionId],
		queryFn: () => fetchSavedRanking(editionId),
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
				if (fetchedSaved) {
					if (!savedRanking) {
						setRankings(
							(edition?.submissionList as Submission[])
								.filter((s) => s.rejected !== true && s.userId !== user.userId)
								.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number)) as Submission[]
						);
					} else {
						setRankings(
							(edition?.submissionList as Submission[])
								.filter((s) => s.rejected !== true && s.userId !== user.userId)
								.sort(
									(a, b) =>
										(savedRanking.rankingList?.indexOf(a.submissionId) as number) -
										(savedRanking.rankingList?.indexOf(b.submissionId) as number)
								) as Submission[]
						);
					}
				}
			}
		}
	}, [isFetched, fetchedSaved]);

	const handleResetRankings = () => {
		setRankings(
			(edition?.submissionList as Submission[])
				.filter((s) => s.rejected !== true && s.userId !== user.userId)
				.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number)) as Submission[]
		);
	};

	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();

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

	const handleDragStart = () => {
		setSaved(false);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = rankings.findIndex((item) => item.submissionId === active.id);
			const newIndex = rankings.findIndex((item) => item.submissionId === over.id);
			const newOrder = arrayMove(rankings, oldIndex, newIndex);
			setRankings(newOrder);
			setDebouncedRankings(newOrder);
		}
	};

	// --- The Debounce Effect ---
	useEffect(() => {
		if (debouncedRankings.length === 0) return;

		const timerId = setTimeout(() => {
			startTransition(async () => {
				const debouncedRankingsList = debouncedRankings.map((r) => r.submissionId);
				const result = await saveRanking(debouncedRankingsList, editionId);
				if (result.success) {
					setSaved(true);
				}
			});
		}, 3000);

		return () => {
			clearTimeout(timerId);
		};
	}, [debouncedRankings]);

	useEffect(() => {
		if (edition?.spotifyPlaylistLink !== undefined) {
			window.onSpotifyIframeApiReady = (IFrameAPI: IFrameAPI) => {
				console.log('Spotify IFrame API is ready. The playlist link is', edition?.spotifyPlaylistLink);

				const element = playerDivRef.current;

				if (element) {
					const options: EmbedOptions = {
						uri: edition?.spotifyPlaylistLink ? convertPlaylistUrlToUri(edition.spotifyPlaylistLink) : '',
						height: 152,
					};

					IFrameAPI.createController(element, options, (embedController) => {
						embedController.addListener('onPlaybackStatusChange', (status) => {
							if (!status.data.isPaused && status.data.position === 0) {
								console.log('Track finished. Reloading playlist context.');
								embedController.loadUri(edition?.spotifyPlaylistLink ? convertPlaylistUrlToUri(edition.spotifyPlaylistLink) : '');
							}
						});
					});
				}
			};
		}
	}, [edition?.spotifyPlaylistLink]);

	const mouseSensor = useSensor(MouseSensor, {
		activationConstraint: {
			distance: 0,
			handler: '.drag-handle',
		},
	});
	const touchSensor = useSensor(TouchSensor, {
		activationConstraint: {
			handler: '.drag-handle',
			delay: 250,
			tolerance: 5,
		},
	});

	const sensors = useSensors(mouseSensor, touchSensor);

	return (
		<>
			<script src="https://open.spotify.com/embed/iframe-api/v1" async></script>
			<Card className="mb-4 py-6 gap-1">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Vote className="w-5 h-5" />
						Rank Your Top 10
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Button onClick={handleResetRankings} variant="secondary" className="mt-2">
						<Undo2 className="w-4 h-4 mr-2" />
						Reset Rankings
					</Button>
				</CardContent>
			</Card>

			<div className="m-2 font-bold text-xl">Playlist</div>
			<div className="mb-4">
				<div ref={playerDivRef} style={{ height: '352px', width: '100%', marginBottom: '20px' }}></div>
			</div>

			<div className="flex items-center gap-1">
				<div className="m-2 font-bold text-xl mr-auto">Entries</div>
				{!saved && !isPending && isFetched && fetchedSaved && (
					<>
						<div className="text-(--destructive)">Not Saved</div>
						<X className="text-(--destructive)" />
					</>
				)}
				{isPending && (
					<>
						<div>Saving</div>
						<Spinner />
					</>
				)}
				{saved && !isPending && (
					<>
						<div className="text-(--success)">Ranking Saved</div>
						<Check className="text-(--success)" />
					</>
				)}
			</div>

			{isFetched && fetchedSaved && rankings.length === 0 && (
				<Alert>
					<AlertTitle>No entries found</AlertTitle>
					<AlertDescription>Something went wrong fetching the entries</AlertDescription>
				</Alert>
			)}
			{isLoading || loadingSaved ? (
				<>
					<Skeleton>
						<div className="p-3 bg-muted rounded-lg mb-1">
							<Skeleton className="w-50 h-5" />
						</div>
					</Skeleton>
					<Skeleton>
						<div className="p-3 bg-muted rounded-lg mb-1">
							<Skeleton className="w-50 h-5" />
						</div>
					</Skeleton>
				</>
			) : (
				<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]} sensors={sensors}>
					<SortableContext items={rankings.map((item) => item.submissionId)} strategy={verticalListSortingStrategy}>
						{rankings.map((song, index) => (
							<SortableSong key={song.submissionId} id={song.submissionId} song={song} index={index} />
						))}
					</SortableContext>
				</DndContext>
			)}

			<Button onClick={handleSubmitRanking} disabled={rankings.length === 0 || isPending} className="w-full">
				{isPending ? <Spinner /> : <Vote />}
				Submit Votes
			</Button>
		</>
	);
};

export default VotingComponent;
