'use client';

import { Music, Share, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import ContestOptions from '../ContestOptions';
import { useQuery } from '@tanstack/react-query';
import { Schema } from '../../../amplify/data/resource';
import { useRouter } from 'next/navigation';
import EditionList from '../EditionList';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { AuthUser } from 'aws-amplify/auth';

type Contest = Schema['Contest']['type'];

export const fetchContest = async (id: string) => {
	const response = await fetch(`/api/contest/${id}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.contest as Contest;
};

const ContestInfoCard: React.FC<{ contestId: string; user: AuthUser }> = ({ contestId, user }) => {
	const router = useRouter();
	const [isSupported, setIsSupported] = useState(false);

	const { data: contest, isLoading } = useQuery({
		queryKey: ['contestDetails', contestId],
		queryFn: () => fetchContest(contestId),
	});

	// Effect to run once on component mount for feature detection and initial setup
	useEffect(() => {
		if (typeof navigator.share === 'function') {
			setIsSupported(true);
		}
	}, []);

	const handleShare = async () => {
		try {
			await navigator.share({
				title: `Join ${contest?.name}!`,
				text: `{userDisplayName} has invited you to join their Fan Contest!`,
				url: `http://localhost:3000/join/${contest?.contestId as string}`,
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('Aborted share');
			} else {
				console.error('Error sharing content:', error);
				toast.error(`Couldn't get share link`);
			}
		}
	};

	const fallbackCopyToClipboard = () => {
		try {
			const textarea = document.createElement('textarea');
			textarea.value = `http://localhost:3000/join/${contest?.contestId}`;
			// Positioning off-screen to prevent visual disruption
			textarea.style.position = 'fixed';
			textarea.style.left = '-9999px';
			textarea.style.top = '-9999px';
			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();

			const successful = document.execCommand('copy');
			document.body.removeChild(textarea);

			if (!successful) {
				toast.error('Failed to copy join link to clipboard');
			} else {
				toast.success('Copied join link to clipboard!');
			}
		} catch {
			toast.error('Looks like your browser denied access to the clipboard. Sorry!');
		}
	};

	if (isLoading) {
		return (
			<>
				<Button variant="ghost" onClick={() => router.back()} className="mb-4">
					← Back
				</Button>
				<Card className="mb-4 py-6">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Music className="w-5 h-5" />
								<Skeleton className="w-50 h-5" />
							</CardTitle>
						</div>
						<Skeleton className="w-50 h-5" />
					</CardHeader>
				</Card>
				<Skeleton className="w-full h-9 mb-3" />
				<Skeleton className="w-full h-9" />
			</>
		);
	}

	if (!contestId) {
		router.back();
	}

	return (
		contest && (
			<>
				<Button variant="ghost" onClick={() => router.back()} className="mb-4">
					← Back
				</Button>
				<Card className="mb-4 py-6">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Music className="w-5 h-5" />
								{contest.name}
							</CardTitle>
							<Badge variant="secondary">
								{`${contest.participants?.length} ${contest.participants?.length === 1 ? 'participant' : 'participants'}`}
							</Badge>
						</div>
						<p className="text-muted-foreground">{contest.description}</p>
						{user.userId === contest.hostId && <ContestOptions contestId={contestId} />}
					</CardHeader>
				</Card>

				<Button variant="default" onClick={() => router.push(`/contest/${contestId}/participants`)} className="w-full mb-4">
					<Users className="w-4 h-4 mr-2" />
					See Members
				</Button>

				{isSupported ? (
					<Button variant="outline" onClick={handleShare} className="w-full mb-4">
						<Share className="w-4 h-4 mr-2" />
						Invite Friends
					</Button>
				) : (
					<Button variant="outline" onClick={fallbackCopyToClipboard} className="w-full mb-4">
						<Share className="w-4 h-4 mr-2" />
						Invite Friends
					</Button>
				)}

				{/* <Collapsible open={showJoinCode}>
					<CollapsibleContent>
						<Card className="mb-4 py-4 gap-2">
							<CardHeader>
								<CardTitle className="flex items-center">
									<h2 className="font-bold drop-shadow-lg text-center">Join Code</h2>
								</CardTitle>
							</CardHeader>
							<CardContent className="w-full text-center">
								<h2 className="text-4xl">24BV8G</h2>
							</CardContent>
						</Card>
					</CollapsibleContent>
				</Collapsible> */}

				<EditionList contest={contest} />
			</>
		)
	);
};

export default ContestInfoCard;
