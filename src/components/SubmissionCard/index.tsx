import { Trash } from 'lucide-react';
import { Schema } from '../../../amplify/data/resource';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
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

type Submission = Schema['Submission']['type'];

interface SubmissionCardProps {
	submission: Submission;
	onReject: () => void;
	isHost: boolean;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onReject, isHost }) => {
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleRejectSong = () => {
		console.log(`rejecting ${submission.songTitle}`);
		// 2. Wrap the Server Action call in startTransition
		startTransition(async () => {
			const result = await rejectSubmission(submission.submissionId, submission.editionId as string);
			if (result.success) {
				// form.reset(); // Reset form on success
				// toast.success(`Your song "${data.songTitle}" was submitted successfully. Good luck!`);
				onReject();
				toast.success(`${submission.songTitle} rejected successfully.`);
				// Handle success UI (e.g., toast, revalidation)
			} else {
				// Handle error UI
			}
		});
		setDialogOpen(false);
	};

	return (
		<Card className={`p-2 border rounded-lg transition-all`}>
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-5 max-w-5 h-5 rounded-sm border text-center">
					<div className="text-xs w-full h-full text-center">{submission.runningOrder || '0'}</div>
				</div>
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
				<div className="flex-1 truncate">
					<h3 className="font-medium truncate">{submission.songTitle}</h3>
					<p className="text-sm text-muted-foreground truncate">by {submission.artistName}</p>
				</div>
				{isHost && (
					<div className="flex items-center gap-2">
						<Button size="icon" variant="destructive" onClick={() => setDialogOpen(true)}>
							<Trash />
						</Button>
						<AlertDialog open={dialogOpen}>
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
					</div>
				)}
			</div>
		</Card>
	);
};

export default SubmissionCard;
