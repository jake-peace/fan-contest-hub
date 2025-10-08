import { Button } from '../ui/button';
import { CircleX, TicketCheckIcon } from 'lucide-react';
import React, { startTransition, useState } from 'react';
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

interface EditionHostOptionsProps {
	editionId: string;
	phase: string;
	onRefetch: () => void;
}

const EditionHostOptions: React.FC<EditionHostOptionsProps> = ({ editionId, phase, onRefetch }) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [spotifyDialogOpen, setSpotifyDialogOpen] = useState(false);
	const [playlistLink, setPlaylistInputLink] = useState('');

	const queryClient = useQueryClient();

	const handleAction = (description: string) => {
		switch (description) {
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

	const SpotifyPlaylistDialog = () => {
		return (
			<Dialog open={spotifyDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Spotify Playlist</DialogTitle>
						<DialogDescription>{`Enter the link for the playlist below.`}</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3">
						<Label htmlFor="name-1">Link</Label>
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
					<Button variant="destructive" className="w-full" onClick={() => setDialogOpen(true)}>
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
