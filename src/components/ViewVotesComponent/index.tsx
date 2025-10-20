'use client';

import { useQuery } from '@tanstack/react-query';
import { AuthUser } from 'aws-amplify/auth';
import { Schema } from '../../../amplify/data/resource';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ListChecks, MoreHorizontal, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../ui/alert-dialog';
import { useTransition } from 'react';
import { deleteTelevote } from '@/app/actions/deleteTelevote';
import { toast } from 'sonner';
import Loading from '../Loading';
import { Skeleton } from '../ui/skeleton';

type Edition = Schema['Edition']['type'];
type Televote = Schema['Televote']['type'];
type Submission = Schema['Submission']['type'];

interface ViewVotesComponentParams {
	editionId: string;
	user: AuthUser;
}

interface EditionWithTelevotes extends Edition {
	televotesList: Televote[];
	submissionList: Submission[];
}

const rankingPoints = new Map<number, number>([
	[-1, 0],
	[0, 12],
	[1, 10],
	[2, 8],
	[3, 7],
	[4, 6],
	[5, 5],
	[6, 4],
	[7, 3],
	[8, 2],
	[9, 1],
]);

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

const fetchEditionWithTelevotes = async (id: string) => {
	const response = await fetch(`/api/editions/${id}/televotes`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.edition as EditionWithTelevotes;
};

const ViewVotesComponent: React.FC<ViewVotesComponentParams> = ({ editionId }) => {
	const [isPending, startTransition] = useTransition();

	const {
		data: edition,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery({
		queryKey: ['editionTelevotes', editionId],
		queryFn: () => fetchEditionWithTelevotes(editionId),
	});

	const onDeleteTelevote = (televoteId: string) => {
		console.log('trying to delete', televoteId);
		startTransition(async () => {
			const result = await deleteTelevote(televoteId);
			if (result.success) {
				toast.success('Televote has been submitted successfully!');
				refetch();
			} else {
				toast.error(`There was an error deleting the televote: ${result.error}`);
			}
		});
	};

	return isLoading ? (
		<Loading />
	) : (
		<Card className="py-6">
			<CardHeader>
				<CardTitle className="flex gap-2 items-center">
					<ListChecks />
					{`Televotes for ${edition?.name}`}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				{isRefetching ? (
					<>
						<Skeleton className="w-full h-3 mb-2" />
						<Skeleton className="w-full h-3 mb-2" />
					</>
				) : (
					edition?.televotesList.map((t) => (
						<Card className="p-2" key={t.televoteId}>
							<Collapsible>
								<div className="flex gap-2 items-center">
									{t.guestName}
									<CollapsibleTrigger className="ml-auto border p-1.5 rounded-md">
										<MoreHorizontal />
									</CollapsibleTrigger>
									<AlertDialog>
										<AlertDialogTrigger className="border p-1.5 rounded-md bg-(--destructive)">
											<Trash2 />
										</AlertDialogTrigger>
										<AlertDialogContent className="">
											<AlertDialogHeader>
												<AlertDialogTitle>Delete this televote?</AlertDialogTitle>
												<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction onClick={() => onDeleteTelevote(t.televoteId)}>Continue</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
								<CollapsibleContent className="mt-2 space-y-1">
									{!isPending &&
										t.rankingList?.map((s, index) => (
											<div key={s} className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border`}>
												<div className="flex items-center justify-between gap-3">
													<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
														<Image
															src={`https://flagcdn.com/w640/${edition.submissionList?.find((a) => a.submissionId === s)?.flag?.toLowerCase()}.png`}
															fill
															alt={`${edition.submissionList?.find((a) => a.submissionId === s)?.countryName}'s flag`}
															style={{ objectFit: 'cover', objectPosition: 'center' }}
															quality={80}
															sizes="640px"
														/>
													</div>
													<div className="flex-1 truncate">
														<h3 className="font-medium truncate">{edition.submissionList?.find((a) => a.submissionId === s)?.songTitle}</h3>
														<p className="text-sm text-muted-foreground truncate">
															by {edition.submissionList?.find((a) => a.submissionId === s)?.artistName}
														</p>
													</div>
													<div className="flex items-center gap-2">
														<Badge variant="secondary" className={getBadgeColor(index + 1)}>
															{rankingPoints.get(index)}
														</Badge>
													</div>
												</div>
											</div>
										))}
								</CollapsibleContent>
							</Collapsible>
						</Card>
					))
				)}
			</CardContent>
		</Card>
	);
};

export default ViewVotesComponent;
