'use client';

import { AuthUser } from 'aws-amplify/auth';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../Loading';
import { startTransition } from 'react';
import { Schema } from '../../../amplify/data/resource';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { joinContest } from '@/app/actions/joinContest';

interface JoinContestCardProps {
	user?: AuthUser;
	joinCode: string;
}

type Contest = Schema['Contest']['type'];

const fetchContestByJoinCode = async (id: string) => {
	const response = await fetch(`/api/contest/getByJoinCode/${id}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.contest as Contest;
};

const JoinContestCard: React.FC<JoinContestCardProps> = ({ user, joinCode }) => {
	const router = useRouter();
	const queryClient = useQueryClient();

	const {
		data: contest,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['contestDetailsJoinContest'],
		queryFn: () => fetchContestByJoinCode(joinCode),
	});

	const handleJoinContest = () => {
		startTransition(async () => {
			const result = await joinContest(joinCode, contest?.contestId as string);
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ['userContestList'] });
				router.push(`/`);
				toast.success(`You've joined ${contest?.name}!`);
			} else {
				toast.error(`Something went wrong joining the contest: ${result.error}`);
			}
		});
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return (
			<Card className="p-6 m-6 items-center">
				<div className="font-bold text-lg">Invalid join code</div>
				<Button onClick={() => router.push('/')}>Return to home</Button>
			</Card>
		);
	}

	if (contest && user && contest.participants?.includes(user.userId)) {
		return (
			<Card className="m-4 p-6 items-center">
				<div className="font-bold text-lg">{`You're already in this contest`}</div>
				<Button onClick={() => router.push(`/contest/${contest.contestId}`)} className="w-full mt-2">
					{`Go to ${contest.name}`}
				</Button>
			</Card>
		);
	}

	return (
		<Card className="items-center">
			<div className="font-bold text-lg">Name has invited you to join</div>
			<div className="font-bold text-4xl wrap text-center">{contest?.name}</div>
			{user ? (
				<Button onClick={handleJoinContest} className="w-full mt-2">
					Join
				</Button>
			) : (
				<div className="space-y-2 p-0">
					<Button className="w-full">Create an account to join</Button>
					<Button className="w-full" variant="outline">
						Login
					</Button>
				</div>
			)}
		</Card>
	);
};

export default JoinContestCard;
