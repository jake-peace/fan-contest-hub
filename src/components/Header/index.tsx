'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '../Dashboard';
import { Button } from '../ui/button';
import { HelpCircle, Mic2, User } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';
import { Card } from '../ui/card';
import { signOut } from 'aws-amplify/auth';

const Header: React.FC = () => {
	const router = useRouter();
	const pathname = usePathname();

	const excludedPathnames = ['/results', '/signin', '/join'];

	const { data: profile, isLoading: profileLoading } = useQuery({
		queryKey: ['userProfileHeader'],
		queryFn: () => fetchProfile(),
		enabled: pathname !== '/signin',
	});

	return (
		<>
			{excludedPathnames.find((p) => pathname.includes(p)) === undefined && (
				<div className="flex mb-2 gap-2">
					{pathname !== '/' ? (
						<Button variant="ghost" onClick={() => router.back()} className="mr-auto">
							← Back
						</Button>
					) : (
						<>
							<Card className="mr-auto justify-center p-1 px-2 rounded-md">
								<div className="self-center flex gap-2">
									<Mic2 />
									Fan Contest
								</div>
							</Card>
							<Button variant="outline">
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
						<Button variant="outline" onClick={async () => await signOut()}>
							<User />
							{profile.displayName}
						</Button>
					)}
					{/* <Button onClick={onLogout} variant="outline">
						Logout
					</Button> */}
				</div>
			)}
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
