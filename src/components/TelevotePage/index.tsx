'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Vote, Undo2, Rows4, Smile } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Schema } from '../../../amplify/data/resource';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';
import { Toggle } from '../ui/toggle';
import { EditionWithDetails } from '@/types/Edition';
import SortableSongCompact from '../VotingComponent/SortableSongCompact';
import SortableSong from '../VotingComponent/SortableSong';
import { submitTelevote } from '@/app/actions/submitTelevote';
import { Input } from '../ui/input';

interface TelevotePageProps {
	televoteId: string;
}

type Submission = Schema['Submission']['type'];
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

const fetchEditionFromTelevote = async (id: string) => {
	const response = await fetch(`/api/editions/televote/${id}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.edition as EditionWithDetails;
};

const TelevotePage: React.FC<TelevotePageProps> = ({ televoteId }) => {
	const [rankings, setRankings] = useState<Submission[]>([]);
	const [name, setName] = useState('');
	const [successful, setSuccessful] = useState(false);
	const router = useRouter();
	const playerDivRef = useRef<HTMLDivElement>(null);

	const {
		data: edition,
		isLoading,
		isFetched,
	} = useQuery({
		queryKey: ['televoteDetails', televoteId],
		queryFn: () => fetchEditionFromTelevote(televoteId),
	});

	useEffect(() => {
		if (isFetched) {
			if (edition?.phase !== 'VOTING') {
				router.push(`/signin`);
				toast.error('Voting is not open for this edition.');
			} else {
				setRankings(
					(edition?.submissionList as Submission[])
						.filter((s) => s.rejected !== true)
						.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number)) as Submission[]
				);
			}
		}
	}, [isFetched]);

	const handleResetRankings = () => {
		setRankings(
			(edition?.submissionList as Submission[])
				.filter((s) => s.rejected !== true)
				.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number)) as Submission[]
		);
	};

	const [isPending, startTransition] = useTransition();

	const handleSubmitRanking = async () => {
		startTransition(async () => {
			const rankingList = rankings.map((r) => r.submissionId).slice(0, 10);
			const result = await submitTelevote(rankingList, edition?.editionId as string, name);
			if (result.success) {
				toast.success('Your televote has been submitted successfully!');
				setSuccessful(true);
			} else {
				toast.error(`There was an error submitting your votes: ${result.error}`);
			}
		});
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = rankings.findIndex((item) => item.submissionId === active.id);
			const newIndex = rankings.findIndex((item) => item.submissionId === over.id);
			const newOrder = arrayMove(rankings, oldIndex, newIndex);
			setRankings(newOrder);
		}
	};

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
	const [isCompact, setIsCompact] = useState(false);

	if (successful) {
		return (
			<>
				<div className="w-full flex items-center justify-between wrap mb-2">
					<Card className="w-50 items-center justify-between p-2">fancontest.org</Card>
					<Button onClick={() => router.push('/signin')}>Create an account!</Button>
				</div>
				<Card className="mb-4 py-6 gap-1">
					<CardHeader>
						<CardTitle className="flex gap-3 items-center">
							<Smile />
							<div className="text-2xl font-bold">Thanks for voting!</div>
						</CardTitle>
					</CardHeader>
				</Card>
			</>
		);
	}

	return (
		<>
			<script src="https://open.spotify.com/embed/iframe-api/v1" async></script>
			<Card className="mb-4 py-6 gap-1">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Vote className="w-5 h-5" />
						{/* {isLoading ? <Skeleton /> : `Submit a televote for ${edition?.name} in ${edition?.contestDetails.name}`} */}
						{isLoading ? <Skeleton /> : `Submit a televote for ${edition?.name}`}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-between">
					<Button onClick={handleResetRankings} variant="secondary" className="mt-2">
						<Undo2 className="w-4 h-4 mr-2" />
						Reset Rankings
					</Button>
					<Toggle className="flex gap-1 items-center" pressed={isCompact} onPressedChange={() => setIsCompact(!isCompact)}>
						<Rows4 />
						Compact
					</Toggle>
				</CardContent>
			</Card>

			{edition?.spotifyPlaylistLink && (
				<>
					<div className="m-2 font-bold text-xl">Playlist</div>
					<div className="mb-4">
						<div ref={playerDivRef} style={{ height: '352px', width: '100%', marginBottom: '20px' }}></div>
					</div>
				</>
			)}

			<div className="flex items-center gap-1">
				<div className="m-2 font-bold text-xl mr-auto">Your Name</div>
			</div>

			<Input placeholder="Enter your name here" value={name} onChange={(e) => setName(e.target.value)} />
			<div className="text-muted-foreground text-sm mt-1">Name must be 3 or more characters.</div>

			<div className="flex items-center gap-1">
				<div className="m-2 font-bold text-xl mr-auto">Entries</div>
			</div>

			{isFetched && rankings.length === 0 && (
				<Alert className="mb-2">
					<AlertTitle>No entries found</AlertTitle>
					<AlertDescription>Something went wrong fetching the entries</AlertDescription>
				</Alert>
			)}
			{isLoading ? (
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
				<DndContext onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]} sensors={sensors}>
					<SortableContext items={rankings.map((item) => item.submissionId)} strategy={verticalListSortingStrategy}>
						{rankings.map((song, index) =>
							isCompact ? (
								<SortableSongCompact key={song.submissionId} id={song.submissionId} song={song} index={index} />
							) : (
								<SortableSong key={song.submissionId} id={song.submissionId} song={song} index={index} />
							)
						)}
					</SortableContext>
				</DndContext>
			)}

			<Button onClick={handleSubmitRanking} disabled={rankings.length === 0 || isPending || name.length < 3} className="w-full">
				{isPending ? <Spinner /> : <Vote />}
				Submit Votes
			</Button>
		</>
	);
};

export default TelevotePage;
