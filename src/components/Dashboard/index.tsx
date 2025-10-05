'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleDashed, Clock, Hash, Plus, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setContest } from '@/app/store/reducers/contestReducer';
import { useQuery } from '@tanstack/react-query';
import { signOut } from 'aws-amplify/auth';
import { toast } from 'sonner';
import { Schema } from '../../../amplify/data/resource';
import { Skeleton } from '../ui/skeleton';
import { joinContestWithCode } from '@/app/actions/joinContestWithCode';

type Contest = Schema['Contest']['type'];

const fetchContests = async () => {
	// Call the secure Next.js Route Handler
	const response = await fetch(`/api/contest`);

	if (!response.ok) {
		// TanStack Query's error boundary will catch this
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.contests; // Return the clean data
};

const DashboardPage: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const nickname = useAppSelector((state) => state.user.user.nickname);

	const {
		data: contests,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['userContestList'],
		queryFn: () => fetchContests(),
	});

	const onLogout = async () => {
		await signOut();
		toast.success('Signed out');
		router.push('/signin');
	};

	const getPhaseIcon = () => {
		return <CircleDashed className="w-3 h-3" />;
	};

	const getEditionName = () => {
		return 'No editions';
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
				toast.error(`${result.error}`);
			}
		});
	};

	return (
		<div className="min-h-screen bg-background p-4">
			<div className="max-w-md mx-auto">
				<div className="flex gap-1 mb-4">
					<Button variant="outline">
						<User />
						{nickname}
					</Button>
					<Button onClick={onLogout} variant="outline">
						Logout
					</Button>
					<ThemeToggle />
				</div>

				<div className="space-y-4 mb-6">
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
							contests.map((contest: Contest) => (
								<Card
									key={contest.contestId}
									className="cursor-pointer hover:bg-muted/50 transition-colors"
									onClick={() => onSelectContest(contest.contestId as string)}
								>
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-medium truncate">{contest.name}</h3>
											<Badge variant="outline" className="text-xs">
												{getPhaseIcon()}
											</Badge>
										</div>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span className="flex items-center gap-1">
												<Users className="w-3 h-3" />
												{contest.description}
											</span>
											<h3 className="font-medium truncate">{getEditionName()}</h3>
											<span className="flex items-center gap-1">
												<Clock className="w-3 h-3" />
											</span>
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
			</div>
		</div>
	);
};

export default DashboardPage;
