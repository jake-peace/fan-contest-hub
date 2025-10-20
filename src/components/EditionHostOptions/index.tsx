import { Button } from '../ui/button';
import { CircleX, DoorOpen, HelpCircle, ListChecksIcon, TicketCheckIcon } from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { closeSubmissions } from '@/app/actions/closeSubmissions';
import { toast } from 'sonner';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog';
import { closeVoting } from '@/app/actions/closeVoting';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { setPlaylistLink } from '@/app/actions/setPlaylistLink';
import Image from 'next/image';
import { openSubmissions } from '@/app/actions/openSubmissions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Alert, AlertTitle } from '../ui/alert';
import { Card } from '../ui/card';
import { Schema } from '../../../amplify/data/resource';
import { openTelevote } from '@/app/actions/openTelevote';
import { Spinner } from '../ui/spinner';
import { useRouter } from 'next/navigation';

type Submission = Schema['Submission']['type'];

interface EditionHostOptionsProps {
	editionId: string;
	phase: string;
	onRefetch: () => void;
	submissions?: Submission[];
	televote: boolean;
}

const EditionHostOptions: React.FC<EditionHostOptionsProps> = ({ editionId, phase, onRefetch, submissions, televote }) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [spotifyDialogOpen, setSpotifyDialogOpen] = useState(false);
	const [playlistLink, setPlaylistInputLink] = useState('');
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();

	console.log(televote);

	const handleAction = (description: string) => {
		switch (description) {
			case 'open submissions':
				startTransition(async () => {
					const result = await openSubmissions(editionId);
					if (result.success) {
						toast.success('Submissions opened!');
						onRefetch();
						setDialogOpen(false);
					} else {
						// Handle error UI
					}
				});
				break;
			case 'close submissions':
				startTransition(async () => {
					const result = await closeSubmissions(editionId);
					if (result.success) {
						toast.success('Submissions closed!');
						onRefetch();
						setDialogOpen(false);
					} else {
						// Handle error UI
					}
				});
				break;
			case 'close voting':
				startTransition(async () => {
					const result = await closeVoting(editionId);
					if (result.success) {
						toast.success('Voting closed!');
						onRefetch();
						setDialogOpen(false);
					} else {
						// Handle error UI
					}
				});
				break;
			default:
				return;
		}
	};

	const ConfirmActionDialog = (description: string) => {
		return (
			<AlertDialog open={dialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{`You're about to ${description}`}</AlertDialogTitle>
						<AlertDialogDescription>{`Are you sure you want to ${description}? You can't undo this action yet.`}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDialogOpen(false)}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => handleAction(description)}>Continue</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	};

	const handleSetSpotifyPlaylist = () => {
		startTransition(async () => {
			const result = await setPlaylistLink(editionId, playlistLink);
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ['editionDetails', editionId] });
				toast.success(`Playlist link saved`);
				setSpotifyDialogOpen(false);
			} else {
				toast.error('Something went wrong saving the playlist link');
			}
		});
	};

	const handleOpenTelevote = () => {
		startTransition(async () => {
			const result = await openTelevote(editionId);
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ['editionDetails', editionId] });
				toast.success(`Televote opened!`);
			} else {
				toast.error('Something went wrong opening the televote.');
			}
		});
	};

	const SpotifyPlaylistDialog = () => {
		return (
			<Dialog open={spotifyDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Spotify Playlist</DialogTitle>
						<DialogDescription>{`Enter the link for the playlist below.`}</DialogDescription>
						<Collapsible>
							<CollapsibleTrigger>
								<Alert>
									<AlertTitle className="flex items-center gap-2">
										<HelpCircle />
										Click here for a list of pastable Spotify links
									</AlertTitle>
								</Alert>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div className="text-sm p-2">
									Copy and paste the Spotify URI&apos;s of all the songs below into a new playlist on the Spotify Desktop App. This feature
									is not yet supported on mobile. (Use CTRL/CMD + V in the Spotify desktop app to paste.)
								</div>
								<Card>
									<ul>
										{submissions &&
											submissions
												.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))
												.map((s) => s.spotifyUri && <li key={s.submissionId}>{`spotify:track:${s.spotifyUri}`}</li>)}
									</ul>
								</Card>
							</CollapsibleContent>
						</Collapsible>
					</DialogHeader>
					<div className="grid gap-3">
						<Label htmlFor="name-1">Spotify Playlist Link</Label>
						<Input value={playlistLink} onChange={(e) => setPlaylistInputLink(e.target.value)} />
					</div>
					<DialogFooter>
						<DialogClose asChild onClick={() => setSpotifyDialogOpen(false)}>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<Button onClick={handleSetSpotifyPlaylist}>Save changes</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	};

	switch (phase) {
		case 'SUBMISSION':
			return (
				<>
					<Button variant="destructive" className="w-full" onClick={() => setDialogOpen(true)}>
						<CircleX className="w-4 h-4 mr-2" />
						Close Submissions
					</Button>
					{ConfirmActionDialog('close submissions')}
				</>
			);
		case 'VOTING':
			return (
				<>
					<Button className="w-full relative hover:bg-muted" variant="outline" onClick={() => setSpotifyDialogOpen(true)}>
						<Image src={`/spotifyLogo.svg`} width={20} height={20} alt={`spotifyLogo`} quality={80} sizes="640px" />
						Add Spotify Playlist
					</Button>
					{SpotifyPlaylistDialog()}
					{televote ? (
						<Button className="w-full mb-2" variant="outline" onClick={() => router.push(`/edition/${editionId}/votes`)}>
							<ListChecksIcon />
							View Televotes
						</Button>
					) : (
						<Button className="w-full relative hover:bg-muted mb-2" variant="outline" onClick={handleOpenTelevote} disabled={isPending}>
							{isPending ? <Spinner /> : <DoorOpen />}
							Open a Televote
						</Button>
					)}
					<Button variant="destructive" className="w-full mt-2" onClick={() => setDialogOpen(true)}>
						<CircleX className="w-4 h-4 mr-2" />
						Close Voting
					</Button>
					{ConfirmActionDialog('close voting')}
				</>
			);
		case 'UPCOMING':
			return (
				<>
					<Button variant="outline" className="w-full" onClick={() => setDialogOpen(true)}>
						<TicketCheckIcon className="w-4 h-4 mr-2" />
						Open Submissions
					</Button>
					{ConfirmActionDialog('open submissions')}
				</>
			);
		case 'RESULTS':
			return (
				<>
					<Button variant="outline" className="w-full relative hover:bg-muted" onClick={() => setSpotifyDialogOpen(true)}>
						<Image src={`/spotifyLogo.svg`} width={20} height={20} alt={`spotifyLogo`} quality={80} sizes="640px" />
						Add Spotify Playlist
					</Button>
					{SpotifyPlaylistDialog()}
				</>
			);
		default:
			return;
	}
};

export default EditionHostOptions;
