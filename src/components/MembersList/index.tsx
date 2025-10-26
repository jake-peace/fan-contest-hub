'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Schema } from '../../../amplify/data/resource';
import { Disc3, ListOrdered } from 'lucide-react';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import SubmissionCard from '../SubmissionCard';
import { SubmissionWithScore } from '../ResultsComponent';
import { useRouter } from 'next/navigation';
// import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
// import { useState } from 'react';

type Profile = Schema['Profile']['type'];
// type Submission = Schema['Submission']['type'];

export interface ProfileWithEntries extends Profile {
	entries: SubmissionWithScore[];
}

interface MembersListProps {
	contestId: string;
}

export const fetchParticipants = async (id: string) => {
	const response = await fetch(`/api/contest/${id}/participants`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.participants as ProfileWithEntries[];
};

// const fetchParticipantEntries = async (id: string, userId: string) => {
// 	const response = await fetch(`/api/contest/${id}/entries/${userId}`);

// 	if (!response.ok) {
// 		throw new Error('Failed to fetch data from the server.');
// 	}

// 	const result = await response.json();
// 	return result.entries as Submission[];
// };

const MembersList: React.FC<MembersListProps> = ({ contestId }) => {
	const router = useRouter();

	const { data: members, isLoading } = useQuery({
		queryKey: ['contestParticipants', contestId],
		queryFn: () => fetchParticipants(contestId),
	});

	console.log(members);

	return (
		<>
			<Card className="py-4 gap-2">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Participants</CardTitle>
						<Button className="" onClick={() => router.push(`/contest/${contestId}/leaderboard`)}>
							<ListOrdered />
							Leaderboard
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<>
							<Skeleton className="w-full h-30 mb-2" />
							<Skeleton className="w-full h-30" />
						</>
					) : (
						members &&
						members.map((m) => (
							<div key={m.userId}>
								<Collapsible>
									<Card className="p-2 mb-2">
										<div className="flex items-center justify-between max-w-100 overflow-hidden">
											<div className="flex items-center gap-2 min-w-0">
												<Avatar>
													<AvatarImage
														src={
															'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/961px-President_Barack_Obama.jpg'
														}
													/>
												</Avatar>
												<h3 className="text-lg truncate min-w-0 flex-grow">{m.displayName}</h3>
											</div>
											<CollapsibleTrigger className="border rounded-md p-1.5">
												{/* <Button size="icon" className="shrink-0" variant="outline" onClick={() => toast.message('Coming soon')}> */}
												<Disc3 />
												{/* </Button> */}
											</CollapsibleTrigger>
										</div>
										{/* <div className="flex w-full items-center justify-between">
									<div className="bg-(--gold) flex text-black px-4 py-2 rounded-lg gap-2">
										<Trophy />
										<div className="font-bold">2</div>
									</div>
									<div className="bg-(--silver) flex text-black px-4 py-2 rounded-lg gap-2">
										<Medal />
										<div className="font-bold">2</div>
									</div>
									<div className="bg-(--bronze) flex text-black px-4 py-2 rounded-lg gap-2">
										<Medal />
										<div className="font-bold">2</div>
									</div>
								</div> */}
									</Card>
									<CollapsibleContent>
										<Card className="p-2 mb-2 space-y-0 gap-1">
											<CardTitle>
												<div className="font-bold">{`${m.displayName}'s Entries`}</div>
											</CardTitle>
											{m.entries &&
												m.entries
													.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
													.map((e) => (
														<SubmissionCard
															key={e.submissionId}
															submission={e}
															isHost={false}
															isUser={false}
															contestId={contestId}
															score={e.score}
														/>
													))}
										</Card>
									</CollapsibleContent>
								</Collapsible>
							</div>
						))
					)}
				</CardContent>
			</Card>
		</>
	);
};

export default MembersList;
