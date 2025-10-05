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

interface EditionHostOptionsProps {
	editionId: string;
	phase: string;
	onRefetch: () => void;
}

const EditionHostOptions: React.FC<EditionHostOptionsProps> = ({ editionId, phase, onRefetch }) => {
	const [dialogOpen, setDialogOpen] = useState(false);

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
		default:
			return;
	}
};

export default EditionHostOptions;
