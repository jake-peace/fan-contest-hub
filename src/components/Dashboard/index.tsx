'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Disc3, Hash, Info, ListOrdered, Music, Plus, Users, Vote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { useAppDispatch } from '@/app/store/hooks';
import { setContest } from '@/app/store/reducers/contestReducer';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Schema } from '../../../amplify/data/resource';
import { Skeleton } from '../ui/skeleton';
import { joinContestWithCode } from '@/app/actions/joinContestWithCode';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type Contest = Schema['Contest']['type'];
type Edition = Schema['Edition']['type'];

interface ContestWithEditions extends Contest {
	fulfilledEditions: Edition[];
	hostName: string;
}

const fetchContests = async () => {
	// Call the secure Next.js Route Handler
	const response = await fetch(`/api/contest`);

	if (!response.ok) {
		// TanStack Query's error boundary will catch this
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.contests as ContestWithEditions[]; // Return the clean data
};

export const fetchProfile = async () => {
	// Call the secure Next.js Route Handler
	const response = await fetch(`/api/profile/user`);

	if (!response.ok) {
		// TanStack Query's error boundary will catch this
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.profile; // Return the clean data
};

const DashboardPage: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();

	const {
		data: contests,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['userContestList'],
		queryFn: () => fetchContests(),
	});

	const getPhaseIcon = () => {
		return <Music className="w-3 h-3" />;
	};

	const getEditionStatus = (contest: ContestWithEditions) => {
		const resultsEditions = contest.fulfilledEditions.filter((e) => e.phase === 'RESULTS');
		const votingEditions = contest.fulfilledEditions.filter((e) => e.phase === 'VOTING');
		const submissionEditions = contest.fulfilledEditions.filter((e) => e.phase === 'SUBMISSION');
		const upcomingEditions = contest.fulfilledEditions.filter((e) => e.phase === 'UPCOMING');

		if (votingEditions.length > 0) {
			return (
				<span className="flex items-center gap-1">
					<Vote className="w-3 h-3" />
					{`${votingEditions.length} edition${votingEditions.length === 1 ? '' : 's'} to vote in`}
				</span>
			);
		}

		if (upcomingEditions.length > 0) {
			return (
				<span className="flex items-center gap-1">
					<Clock className="w-3 h-3" />
					{`${upcomingEditions.length} edition${upcomingEditions.length === 1 ? ' is' : 's are'} starting soon`}
				</span>
			);
		}

		if (submissionEditions.length > 0) {
			return (
				<span className="flex items-center gap-1">
					<Disc3 className="w-3 h-3" />
					{`${submissionEditions.length} edition${submissionEditions.length === 1 ? '' : 's'} to submit a song for`}
				</span>
			);
		}

		if (resultsEditions.length > 0) {
			return (
				<span className="flex items-center gap-1">
					<ListOrdered className="w-3 h-3" />
					{`${resultsEditions.length} edition${resultsEditions.length === 1 ? '' : 's'} have results available`}
				</span>
			);
		}
	};

	const [joinCode, setJoinCode] = useState('');

	const onSelectContest = (contestId: string) => {
		dispatch(setContest(contestId));
		router.push(`/contest/${contestId}`);
	};

	const handleJoinWithCode = () => {
		startTransition(async () => {
			const result = await joinContestWithCode(joinCode);
			if (result.success) {
				refetch();
				router.push(`/`);
				toast.success(`You've joined ${result.contest}!`);
			} else {
				toast.error(`Failed to join contest`);
			}
		});
	};

	return (
		<>
			{/* <div className="flex gap-1 mb-4">
				{!profileLoading && (
					<Button variant="outline">
						<User />
						{profile.displayName}
					</Button>
				)}
				<Button onClick={onLogout} variant="outline">
					Logout
				</Button>
				<ThemeToggle />
			</div> */}
			<div className="space-y-4 mb-6">
				<Alert>
					<AlertTitle className="flex gap-1 items-center">
						<Info />
						Version 0.4.2 - 12/10/2025
					</AlertTitle>
					<AlertDescription>
						<ul>
							<li>{`- Added a view of a user's submitted song`}</li>
							<li>{`- Added ability to withdraw submission`}</li>
							<li>{`- Improved list of submissions on Edition page`}</li>
							<li>{`- Contest host can manually open submissions`}</li>
							<li>{`- Added flags of UK constituent countries, EU and UN`}</li>
							<li>{`- Removed one flag`}</li>
						</ul>
					</AlertDescription>
				</Alert>
				{/* Create contest button */}
				<Button onClick={() => router.push('/create/contest')} className="w-full h-12">
					<Plus className="w-5 h-5 mr-2" />
					Create New Contest
				</Button>

				{/* Join contest card */}
				<Card className="py-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Hash className="w-5 h-5" />
							Join with Code
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<Label htmlFor="join-code">Contest Code</Label>
							<Input
								id="join-code"
								value={joinCode}
								onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
								placeholder="Enter contest code"
								maxLength={6}
							/>
						</div>
						<Button onClick={handleJoinWithCode} variant="outline" className="w-full" disabled={!joinCode.trim()}>
							Join Contest
						</Button>
					</CardContent>
				</Card>
			</div>
			<div>
				<h2 className="mb-4">Active Contests</h2>
				<div className="space-y-3">
					{!isLoading ? (
						contests?.map((contest: ContestWithEditions) => (
							<Card
								key={contest.contestId}
								className="cursor-pointer hover:bg-muted/50 transition-colors"
								onClick={() => onSelectContest(contest.contestId as string)}
							>
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-2">
										<h3 className="font-medium truncate">{contest.name}</h3>
										<Badge variant="default" className="text-xs">
											{getPhaseIcon()}
										</Badge>
									</div>
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										{`Hosted by ${contest.hostName}`}
										<span className="flex items-center gap-1">
											<Users className="w-3 h-3" />
											{contest.participants?.length}
										</span>
										{getEditionStatus(contest)}
									</div>
								</CardContent>
							</Card>
						))
					) : (
						<>
							<Skeleton className="w-full h-20 rounded-lg mb-2" />
							<Skeleton className="w-full h-20 rounded-lg" />
						</>
					)}
				</div>
			</div>
		</>
	);
};

export default DashboardPage;
