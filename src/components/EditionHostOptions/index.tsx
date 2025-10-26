import { Button } from '../ui/button';
import {
	CalendarClock,
	ChartCandlestick,
	ChevronDownIcon,
	CircleX,
	DoorOpen,
	HelpCircle,
	ListChecksIcon,
	Share,
	TicketCheckIcon,
} from 'lucide-react';
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
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';
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
import { ButtonGroup } from '../ui/button-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import DateTimeHandler from '../DateTimeHandler';
import { setAutoCloseVoting } from '@/app/actions/setAutoCloseVoting';
import { formatDate } from '@/utils';

type Submission = Schema['Submission']['type'];

interface EditionHostOptionsProps {
	editionId: string;
	phase: string;
	onRefetch: () => void;
	submissions?: Submission[];
	televote: boolean;
	editionName: string;
	televoteId?: string;
	closeVotingType: 'specificDate' | 'manually';
}

const EditionHostOptions: React.FC<EditionHostOptionsProps> = ({
	editionId,
	phase,
	onRefetch,
	submissions,
	televote,
	editionName,
	televoteId,
	closeVotingType,
}) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [spotifyDialogOpen, setSpotifyDialogOpen] = useState(false);
	const [playlistLink, setPlaylistInputLink] = useState('');
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();
	const [submissionDeadline, setSubmissionDeadline] = useState<Date>(new Date());
	const [votingDeadline, setVotingDeadline] = useState<Date>(new Date());

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
						toast.error('Something went wrong opening submissions');
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
						toast.error('Something went wrong closing submissions');
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
						toast.error('Something went wrong closing voting');
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

	const handleShare = async () => {
		try {
			await navigator.share({
				title: `Vote in ${editionName}!`,
				text: `You've been invited to be part of the televote for ${editionName}!`,
				url: `http://fancontest.org/televote/${televoteId as string}`,
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('Aborted share');
			} else {
				console.error('Error sharing content:', error);
				toast.error(`Couldn't get share link`);
			}
		}
	};

	const handleAutoCloseVoting = (autoClose: boolean) => {
		console.log('autoclose', autoClose);
		startTransition(async () => {
			const result = await setAutoCloseVoting(editionId, autoClose);
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ['editionDetails', editionId] });
				toast.success(
					`${autoClose ? 'Enabled' : 'Disabled'} auto-close${autoClose == false && `, voting will close on ${formatDate(result.date as string)}. This can be changed in the dropdown menu.`}`
				);
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
		case 'VOTING':
			return (
				<>
					<div className="w-full flex">
						<ButtonGroup className="w-full">
							<Button variant="outline" className="w-[87.5%]" onClick={() => setDialogOpen(true)}>
								<CircleX className="w-4 h-4 mr-2" />
								Close Submissions
							</Button>
							<Dialog>
								<DropdownMenu>
									<DropdownMenuTrigger asChild className="w-[12.5%]">
										<Button variant="outline" className="!pl-2">
											<ChevronDownIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="[--radius:1rem]">
										<DropdownMenuGroup>
											<DialogTrigger asChild>
												<DropdownMenuItem>
													<CalendarClock />
													Edit submission deadline
												</DropdownMenuItem>
											</DialogTrigger>
											<DropdownMenuItem>
												<ChartCandlestick />
												Enable auto-close
											</DropdownMenuItem>
											{/* <DropdownMenuItem>
												<Eye />
												See who hasn&apos;t submitted
											</DropdownMenuItem> */}
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Edit Submission Deadline</DialogTitle>
										<DialogDescription>{`Submissions will auto-close at this time whether all participants have submitted or not.`}</DialogDescription>
									</DialogHeader>
									<div className="grid gap-3">
										<Label htmlFor="name-1">Deadline</Label>
										<DateTimeHandler value={submissionDeadline} onChange={(e) => setSubmissionDeadline(e)} disabled={false} />
									</div>
									<DialogFooter>
										<DialogClose asChild>
											<Button variant="outline">Cancel</Button>
										</DialogClose>
										<Button onClick={handleSetSpotifyPlaylist}>Save changes</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</ButtonGroup>
					</div>
					{ConfirmActionDialog('close submissions')}
				</>
			);
		case 'SUBMISSION':
			return (
				<>
					<div className="w-full flex">
						<ButtonGroup className="w-full">
							<Button variant="outline" className="w-[87.5%]" onClick={() => setDialogOpen(true)}>
								<CircleX className="w-4 h-4 mr-2" />
								Close Voting
							</Button>
							<Dialog>
								<DropdownMenu>
									<DropdownMenuTrigger asChild className="w-[12.5%]">
										<Button variant="outline" className="!pl-2">
											<ChevronDownIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="[--radius:1rem]">
										<DropdownMenuGroup>
											<DialogTrigger asChild>
												<DropdownMenuItem>
													<CalendarClock />
													Edit voting deadline
												</DropdownMenuItem>
											</DialogTrigger>
											<DropdownMenuItem onClick={() => handleAutoCloseVoting(closeVotingType === 'manually' ? true : false)}>
												<ChartCandlestick />
												Enable auto-close
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => setSpotifyDialogOpen(true)}>
												<Image src={`/spotifyLogo.svg`} width={17.5} height={17.5} alt={`spotifyLogo`} quality={80} sizes="640px" />
												Add Spotify playlist
											</DropdownMenuItem>
											{televote ? (
												<>
													<DropdownMenuItem onClick={() => router.push(`/edition/${editionId}/votes`)}>
														<ListChecksIcon />
														View Televotes
													</DropdownMenuItem>
													<DropdownMenuItem onClick={handleShare}>
														<Share />
														Share Televote Link
													</DropdownMenuItem>
												</>
											) : (
												<DropdownMenuItem onClick={handleOpenTelevote} disabled={isPending}>
													{isPending ? <Spinner /> : <DoorOpen />}
													Open a Televote
												</DropdownMenuItem>
											)}
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Edit Voting Deadline</DialogTitle>
										<DialogDescription>{`Voting will auto-close at this time whether all participants have voted or not.`}</DialogDescription>
									</DialogHeader>
									<div className="grid gap-3">
										<Label htmlFor="name-1">Deadline</Label>
										<DateTimeHandler value={votingDeadline} onChange={(e) => setVotingDeadline(e)} disabled={false} />
									</div>
									<DialogFooter>
										<DialogClose asChild>
											<Button variant="outline">Cancel</Button>
										</DialogClose>
										<Button onClick={handleSetSpotifyPlaylist}>Save changes</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</ButtonGroup>
					</div>
					{SpotifyPlaylistDialog()}
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
