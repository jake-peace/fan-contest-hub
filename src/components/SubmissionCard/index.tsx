import { CircleX, DiscAlbum, Ellipsis, Trash } from 'lucide-react';
import { Schema } from '../../../amplify/data/resource';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
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
import { useState, useTransition } from 'react';
import { rejectSubmission } from '@/app/actions/rejectSubmission';
import { toast } from 'sonner';
import Image from 'next/image';
import { Collapsible, CollapsibleContent } from '../ui/collapsible';
import { Separator } from '../ui/separator';
import { deleteSubmission } from '@/app/actions/deleteSubmission';
import { useAmplifyClient } from '@/app/amplifyConfig';
import { Spinner } from '../ui/spinner';
import { Badge } from '../ui/badge';
import { useQuery } from '@tanstack/react-query';

type Submission = Schema['Submission']['type'];

interface SubmissionCardProps {
	submission: Submission;
	onReject?: () => void;
	isHost: boolean;
	showRunningOrder?: boolean;
	contestId: string;
	isUser?: boolean;
	score?: number;
}

const ordinalRules = new Intl.PluralRules('en-GB', { type: 'ordinal' });

const suffixes = new Map([
	['one', 'st'],
	['two', 'nd'],
	['few', 'rd'],
	['other', 'th'],
]);

function formatOrdinal(n: number): string {
	const rule = ordinalRules.select(n);
	const suffix = suffixes.get(rule);
	return `${n}${suffix}`;
}

const getBadgeColor = (rank: number) => {
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

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onReject, isHost, showRunningOrder, contestId, isUser, score }) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [cardOpen, setCardOpen] = useState(false);
	const client = useAmplifyClient();

	const [isPending, startTransition] = useTransition();

	const handleRejectSong = () => {
		startTransition(async () => {
			const result = await rejectSubmission(submission.submissionId, contestId);
			if (result.success) {
				if (onReject !== undefined) {
					onReject();
				}
				toast.success(`${submission.songTitle} rejected successfully.`);
			} else {
				// Handle error UI
			}
		});
		setDialogOpen(false);
	};

	const handleDeleteSong = () => {
		startTransition(async () => {
			const result = await deleteSubmission(submission.submissionId);
			if (result.success) {
				if (onReject !== undefined) {
					onReject();
				}
				toast.success(`${submission.songTitle} withdrawn successfully.`);
			} else {
				// Handle error UI
			}
		});
		setDialogOpen(false);
	};

	const { data: trackInfo, isLoading } = useQuery({
		queryKey: ['trachInfo', submission.submissionId],
		queryFn: async () => {
			const response = await client.queries.spotifyApi();

			const bodyMatch = (response.data as string).split(',');

			let accessTokenString = '';

			if (bodyMatch && bodyMatch[1]) {
				accessTokenString = bodyMatch[1].split('=')[1];
			}
			const spotifyResults = await fetch(`https://api.spotify.com/v1/tracks/${submission.spotifyUri}?market=GB`, {
				headers: {
					Authorization: `Bearer ${accessTokenString}`,
				},
			});

			const spotifyResultsData = await spotifyResults.json();
			return spotifyResultsData;
		},
		enabled: cardOpen === true && submission.spotifyUri !== undefined,
	});

	return (
		<Card className={`p-2 border rounded-lg transition-all gap-0`}>
			<div className="flex items-center justify-between gap-3">
				{showRunningOrder && (
					<div className="min-w-5 max-w-5 h-5 rounded-sm border text-center">
						<div className="text-xs w-full h-full text-center">{submission.runningOrder || '0'}</div>
					</div>
				)}
				<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
					<Image
						src={`https://flagcdn.com/w640/${submission.flag?.toLowerCase()}.png`}
						fill
						alt={`${submission.artistName}'s flag`}
						style={{ objectFit: 'cover', objectPosition: 'center' }}
						quality={80}
						sizes="640px"
					/>
				</div>
				<div className="flex-1 truncate text-left">
					<h3 className="font-medium truncate">{submission.songTitle}</h3>
					<p className="text-sm text-muted-foreground truncate">by {submission.artistName}</p>
				</div>
				{submission.rank && (
					<div className="flex items-center text-xs">
						<Badge
							variant={submission.rank < 4 ? 'default' : 'outline'}
							className={`${getBadgeColor(submission.rank)}`}
						>{`${formatOrdinal(submission.rank)}`}</Badge>
					</div>
				)}
				<div className="flex items-center">
					<Button size="icon" variant="outline" onClick={() => setCardOpen(!cardOpen)}>
						<Ellipsis />
					</Button>
				</div>
			</div>
			<Collapsible open={cardOpen}>
				<CollapsibleContent>
					{isLoading ? (
						<Spinner />
					) : (
						<CardContent className="py-2 px-0">
							<Separator />
							<div className="flex items-center gap-3 mt-2">
								{trackInfo ? (
									<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
										<Image
											style={{ objectFit: 'cover', objectPosition: 'center' }}
											quality={80}
											fill
											src={trackInfo.album.images[0].url}
											alt={trackInfo.album.name}
											className="w-12 h-12 rounded object-cover"
											sizes="640px"
										/>
									</div>
								) : (
									<DiscAlbum className="w-12 h-12" />
								)}
								<div>
									<h3 className="font-medium">{submission.songTitle}</h3>
									<p className="text-sm text-muted-foreground">by {submission.artistName}</p>
								</div>
							</div>
							<div className="flex flex-wrap mt-2 gap-1">
								{submission.spotifyUri && (
									<Button
										className="relative hover:bg-muted"
										variant="outline"
										onClick={() => window.open(`http://open.spotify.com/track/${submission.spotifyUri}` as string)}
									>
										<Image src={`/spotifyLogo.svg`} width={20} height={20} alt={`spotifyLogoBlack`} quality={80} sizes="640px" />
										Spotify
									</Button>
								)}
								{score && submission.rank && (
									<Badge
										variant={submission.rank < 4 ? 'default' : 'outline'}
										className={`${getBadgeColor(submission.rank)}`}
									>{`Came ${formatOrdinal(submission.rank)} with ${score} points`}</Badge>
								)}
								{isHost && (
									<>
										<Button variant="destructive" onClick={() => setDialogOpen(true)} disabled={isPending}>
											{isPending ? <Spinner /> : <CircleX />}
											Reject Song
										</Button>
										<AlertDialog open={dialogOpen && isHost}>
											<AlertDialogContent className="">
												<AlertDialogHeader>
													<AlertDialogTitle>{`Are you sure you want to reject ${submission.songTitle}?`}</AlertDialogTitle>
													<AlertDialogDescription>
														This cannot be undone, and the user will have to pick another song.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel onClick={() => setDialogOpen(false)}>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={handleRejectSong}>Continue</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</>
								)}
								{isUser && (
									<>
										<Button variant="destructive" onClick={() => setDialogOpen(true)} disabled={isPending}>
											{isPending ? <Spinner /> : <Trash />}
											Withdraw Song
										</Button>
										<AlertDialog open={dialogOpen && !isHost}>
											<AlertDialogContent className="">
												<AlertDialogHeader>
													<AlertDialogTitle>{`Are you sure you want to withdraw your entry ${submission.songTitle}?`}</AlertDialogTitle>
													<AlertDialogDescription>This cannot be undone, and you will have to pick another song.</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel onClick={() => setDialogOpen(false)}>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={handleDeleteSong}>Continue</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</>
								)}
							</div>
						</CardContent>
					)}
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
};

export default SubmissionCard;
