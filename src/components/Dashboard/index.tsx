'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleDashed, Clock, Hash, Plus, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setContest } from '@/app/store/reducers/contestReducer';
import { useAmplifyClient } from '@/app/amplifyConfig';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../ui/spinner';
import { Alert } from '../ui/alert';
import { signOut } from 'aws-amplify/auth';
import { toast } from 'sonner';
import { Schema } from '../../../amplify/data/resource';

type Contest = Schema['Contest']['type'];

const DashboardPage: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const client = useAmplifyClient();
	const nickname = useAppSelector((state) => state.user.user.nickname);

	const onLogout = async () => {
		await signOut();
		toast.success('Signed out');
		router.push('/signin');
	};

	const getPhaseIcon = (contest: string) => {
		// const activeEdition = getActiveEdition(contest);
		// if (activeEdition) {
		//     switch (activeEdition.phase) {
		//         case 'SUBMISSION': return <Music className="w-3 h-3" />;
		//         case 'VOTING': return <Users className="w-3 h-3" />;
		//         case 'RESULTS': return <Trophy className="w-3 h-3" />;
		//         default: return <CircleDashed className="w-3 h-3" />;
		//     }
		// } else {
		//     return <CircleDashed className="w-3 h-3" />;
		// }
		return <CircleDashed className="w-3 h-3" />;
	};

	const getEditionName = (contest: string) => {
		// const activeEdition = getActiveEdition(contest);
		// if (activeEdition) {
		//     return activeEdition.title;
		// } else {
		//     return 'No editions';
		// }
		return 'No editions';
	};

	// const onJoinContest = (id: string) => {
	//     console.log('join contest', id);
	// }

	const [joinCode, setJoinCode] = useState('');

	const onSelectContest = (contestId: string) => {
		dispatch(setContest(contestId));
		router.push('/contest');
	};

	const {
		data: userContests,
		isLoading,
		isSuccess,
	} = useQuery({
		queryKey: ['userContestList'],
		queryFn: async () => {
			const response = await client.models.Contest.list();
			const responseData = response.data;
			if (!responseData) return null;
			return responseData;
		},
	});

	// Dashboard page should have:
	// - Header
	// - Create contest button
	// - Join contest card
	// - List of contests

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

				{/* Header */}
				{/* <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Music className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="mb-2">Song Contest</h1>
                    <p className="text-muted-foreground">
                        Create contests, submit songs, and vote for the winner!
                    </p>
                </div> */}

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
							<Button onClick={() => console.log('handle join with code')} variant="outline" className="w-full" disabled={!joinCode.trim()}>
								Join Contest
							</Button>
						</CardContent>
					</Card>
				</div>

				{isLoading ? (
					<Spinner />
				) : isSuccess && userContests ? (
					<div>
						<h2 className="mb-4">Active Contests</h2>
						<div className="space-y-3">
							{userContests.map((contest: Contest) => (
								<Card
									key={contest.contestId}
									className="cursor-pointer hover:bg-muted/50 transition-colors"
									onClick={() => onSelectContest(contest.contestId as string)}
								>
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-medium truncate">{contest.name}</h3>
											<Badge variant="outline" className="text-xs">
												{getPhaseIcon(contest.contestId as string)}
											</Badge>
										</div>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span className="flex items-center gap-1">
												<Users className="w-3 h-3" />
												{contest.description}
											</span>
											<h3 className="font-medium truncate">{getEditionName(contest.contestId as string)}</h3>
											<span className="flex items-center gap-1">
												<Clock className="w-3 h-3" />
											</span>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				) : (
					<Alert>no contests found</Alert>
				)}
			</div>
		</div>
	);
};

export default DashboardPage;
