import { CircleX, Ellipsis, Trash } from 'lucide-react';
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
import { startTransition, useState } from 'react';
import { rejectSubmission } from '@/app/actions/rejectSubmission';
import { toast } from 'sonner';
import Image from 'next/image';
import { Collapsible, CollapsibleContent } from '../ui/collapsible';
import { Separator } from '../ui/separator';
import { deleteSubmission } from '@/app/actions/deleteSubmission';

type Submission = Schema['Submission']['type'];

interface SubmissionCardProps {
	submission: Submission;
	onReject?: () => void;
	isHost: boolean;
	showRunningOrder?: boolean;
	contestId: string;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onReject, isHost, showRunningOrder, contestId }) => {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [cardOpen, setCardOpen] = useState(false);

	const handleRejectSong = () => {
		console.log(`rejecting ${submission.songTitle}`);
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
				{/* {isHost && ( */}
				<div className="flex items-center">
					<Button size="icon" variant="outline" onClick={() => setCardOpen(!cardOpen)}>
						<Ellipsis />
					</Button>
				</div>
			</div>
			<Collapsible open={cardOpen}>
				<CollapsibleContent>
					<CardContent className="py-2 px-1">
						<Separator />
						<div className="flex-1 text-left mt-2">
							<h3 className="font-medium text-wrap">{submission.songTitle}</h3>
							<p className="text-sm text-muted-foreground">by {submission.artistName}</p>
						</div>
						<div className="flex mt-2 gap-1">
							{submission.spotifyUri && (
								<Button
									className="relative hover:bg-muted"
									variant="outline"
									onClick={() => window.open(`http://open.spotify.com/track/${submission.spotifyUri}` as string)}
								>
									<Image src={`/spotifyLogo.svg`} width={20} height={20} alt={`spotifyLogoBlack`} quality={80} sizes="640px" />
									Listen on Spotify
								</Button>
							)}
							{isHost ? (
								<>
									<Button variant="destructive" onClick={() => setDialogOpen(true)}>
										<CircleX />
										Reject Song
									</Button>
									<AlertDialog open={dialogOpen && isHost}>
										<AlertDialogContent className="">
											<AlertDialogHeader>
												<AlertDialogTitle>{`Are you sure you want to reject ${submission.songTitle}?`}</AlertDialogTitle>
												<AlertDialogDescription>This cannot be undone, and the user will have to pick another song.</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel onClick={() => setDialogOpen(false)}>Cancel</AlertDialogCancel>
												<AlertDialogAction onClick={handleRejectSong}>Continue</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</>
							) : (
								<>
									<Button variant="destructive" onClick={() => setDialogOpen(true)}>
										<Trash />
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
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
};

export default SubmissionCard;
