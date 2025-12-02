'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Schema } from '../../../amplify/data/resource';
import { ListOrdered } from 'lucide-react';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { EntryList } from '../EntryList';
// import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
// import { useState } from 'react';

type Profile = Schema['Profile']['type'];
type Submission = Schema['Submission']['type'];

export interface ProfileWithEntries extends Profile {
	entries: Submission[];
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
							<Skeleton className="w-full h-12 mb-2" />
							<Skeleton className="w-full h-12" />
						</>
					) : (
						<Accordion type="single" collapsible>
							{members &&
								members.map((m) => (
									<AccordionItem key={m.userId} value={m.userId as string}>
										<AccordionTrigger className="justify-center">
											<Avatar>
												<AvatarImage
													src={
														'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/961px-President_Barack_Obama.jpg'
													}
												/>
											</Avatar>
											<h3 className="text-lg truncate min-w-0 flex-grow">{m.displayName}</h3>
										</AccordionTrigger>
										<AccordionContent className="flex flex-col gap-1 text-balance">
											<div className="font-bold">{`${m.displayName}'s Entries`}</div>
											<EntryList contestId={contestId} userId={m.userId as string} />
										</AccordionContent>
									</AccordionItem>
								))}
						</Accordion>
					)}
				</CardContent>
			</Card>
		</>
	);
};

export default MembersList;
