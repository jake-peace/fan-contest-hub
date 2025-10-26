'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '../Dashboard';
import { Button } from '../ui/button';
import { ArrowBigLeft, HelpCircle, Home, Mic2, User } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';
import { Card } from '../ui/card';
import { signOut } from 'aws-amplify/auth';
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
import { useEffect, useState } from 'react';

const fetchContestId = async (id: string) => {
	const response = await fetch(`/api/editions/${id}/contestId`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.contestId as string;
};

const Header: React.FC = () => {
	const router = useRouter();
	const pathname = usePathname();

	const excludedPathnames = ['/results', '/signin', '/join', '/televote'];
	const [signOutDialog, setSignOutDialog] = useState(false);
	const [backPathname, setBackPathname] = useState('/');

	const { data: profile, isLoading: profileLoading } = useQuery({
		queryKey: ['userProfileHeader'],
		queryFn: () => fetchProfile(),
		enabled: excludedPathnames.find((p) => pathname.includes(p)) === undefined,
	});

	const handleSignOut = async () => {
		await signOut();
		router.push('/signin');
		setSignOutDialog(false);
	};

	useEffect(() => {
		const getBackPathname = async () => {
			if (pathname.includes('edition')) {
				if (pathname.includes('vote') || pathname.includes('submit') || pathname.includes('results')) {
					setBackPathname(`/edition/${pathname.split('/')[2]}`);
				} else {
					const contestId = await fetchContestId(pathname.split('/')[2]);
					setBackPathname(`/contest/${contestId}`);
				}
			} else if (pathname.includes('contest')) {
				if (pathname.includes('participants') || pathname.includes('leaderboard')) {
					setBackPathname(`/contest/${pathname.split('/')[2]}`);
				} else {
					setBackPathname('/');
				}
			} else {
				setBackPathname('/');
			}
		};

		getBackPathname();
	}, [pathname]);

	return (
		<>
			{excludedPathnames.find((p) => pathname.includes(p)) === undefined && (
				<div className="flex mb-2 gap-2">
					{pathname !== '/' ? (
						<>
							<Button variant="outline" size="icon" onClick={() => router.push(backPathname)}>
								<ArrowBigLeft />
							</Button>
							<Button variant="outline" size="icon" className="mr-auto" onClick={() => router.push('/')}>
								<Home />
							</Button>
						</>
					) : (
						<>
							<Card className="mr-auto justify-center p-1 px-2 rounded-md">
								<div className="self-center flex gap-2">
									<Mic2 />
									Fan Contest
								</div>
							</Card>
							<Button variant="outline" onClick={() => router.push('/help')}>
								<HelpCircle />
							</Button>
						</>
					)}
					<ThemeToggle />
					{profileLoading ? (
						<Skeleton>
							<Button variant="outline">
								<User />
								<Spinner />
							</Button>
						</Skeleton>
					) : (
						<Button variant="outline" onClick={() => setSignOutDialog(true)}>
							<User />
							{profile.displayName}
						</Button>
					)}
					{/* <Button onClick={onLogout} variant="outline">
						Logout
					</Button> */}
				</div>
			)}
			<AlertDialog open={signOutDialog}>
				<AlertDialogContent className="">
					<AlertDialogHeader>
						<AlertDialogTitle>Sign out?</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to sign out?</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSignOutDialog(false)}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{/* <Collapsible open={profileOpen}>
				<CollapsibleContent className="mb-2">
					<Card>
						<div>hello!</div>
					</Card>
				</CollapsibleContent>
			</Collapsible> */}
		</>
	);
};

export default Header;
