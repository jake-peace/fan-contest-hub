'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Schema } from '../../../amplify/data/resource';
import { Disc3, ListOrdered, Medal, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';

type Profile = Schema['Profile']['type'];

interface MembersListProps {
	contestId: string;
}

const fetchParticipants = async (id: string) => {
	const response = await fetch(`/api/contest/${id}/participants`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.participants as Profile[];
};

const MembersList: React.FC<MembersListProps> = ({ contestId }) => {
	const { data: members, isLoading } = useQuery({
		queryKey: ['contestParticipants', contestId],
		queryFn: () => fetchParticipants(contestId),
	});

	return (
		<>
			<Card className="py-4 gap-2">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Participants</CardTitle>
						<Button className="" onClick={() => toast.message(`Coming soon`)}>
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
							<Card className="p-4" key={m.userId}>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Avatar>
											<AvatarImage
												src={
													'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/961px-President_Barack_Obama.jpg'
												}
											/>
										</Avatar>
										<h3 className="text-lg">{m.displayName}</h3>
									</div>
									<Button size="sm" variant="outline" onClick={() => toast.message(`Coming soon`)}>
										<Disc3 />
										Entries
									</Button>
								</div>
								<div className="flex w-full items-center justify-between">
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
								</div>
							</Card>
						))
					)}
				</CardContent>
			</Card>
		</>
	);
};

export default MembersList;
