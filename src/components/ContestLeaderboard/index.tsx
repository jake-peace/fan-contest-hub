'use client';

import { ListOrdered } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useQuery } from '@tanstack/react-query';
import { EditionWithResults } from '@/app/api/editions/[editionId]/results/route';
import { fetchParticipants } from '../MembersList';
import { Badge } from '../ui/badge';
interface ContestLeaderboardProps {
	contestId: string;
}

const fetchContestResults = async (id: string) => {
	const response = await fetch(`/api/contest/${id}/results`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result as { contestName: string; editions: EditionWithResults[] };
};

const ContestLeaderboard: React.FC<ContestLeaderboardProps> = ({ contestId }) => {
	const { data, isLoading } = useQuery({
		queryKey: ['contestLeaderboard', contestId],
		queryFn: () => fetchContestResults(contestId),
	});

	const { data: members } = useQuery({
		queryKey: ['contestParticipantsLeaderboard', contestId],
		queryFn: () => fetchParticipants(contestId),
	});

	if (isLoading) {
		return (
			<>
				<div>Loading leaderboard data</div>
			</>
		);
	}

	const getBadgeColor = (rank: number) => {
		switch (rank) {
			case 1:
				return 'bg-(--gold) text-[black]';
			case 2:
				return 'bg-(--silver) text-[black]';
			case 3:
				return 'bg-(--bronze) text-[black]';
			default:
				return '';
		}
	};

	const getCombinedScore = (userId: string) => {
		let score = 0;
		data?.editions.forEach((e) => {
			const editionSubmission = e.submissionList.find((s) => s.userId === userId && s.rejected === false);
			score = score + (editionSubmission?.score ? editionSubmission?.score : 0);
		});
		return score;
	};

	return (
		<Card className="py-6">
			<CardHeader>
				<CardTitle className="flex gap-2 items-center">
					<ListOrdered />
					{`${data?.contestName} Leaderboard`}
				</CardTitle>
				<div className="text-sm">{`After ${data?.editions.length} completed ${data?.editions.length === 1 ? 'edition' : 'editions'}`}</div>
			</CardHeader>

			<CardContent className="px-2">
				{members
					?.sort((a, b) => getCombinedScore(b.userId as string) - getCombinedScore(a.userId as string))
					.map((m, index) => (
						<div key={m.userId} className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border mb-1`}>
							<div className="flex items-center justify-between gap-3 w-full">
								<div className="flex items-center gap-2 max-w-7.5 min-w-7.5 text-center justify-center">
									<Badge variant="secondary" className={getBadgeColor(index + 1)}>
										{index + 1}
									</Badge>
								</div>
								{/* <div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
											<Image
												src={`https://flagcdn.com/w640/eu.png`}
												fill
												alt={`d's flag`}
												style={{ objectFit: 'cover', objectPosition: 'center' }}
												quality={80}
												sizes="640px"
											/>
										</div> */}
								<div className="flex-1 truncate">
									<h3 className="font-medium truncate">{m.displayName}</h3>
									{/* <p className="text-sm text-muted-foreground truncate">by {song?.artistName}</p> */}
								</div>
								<div
									className={`text-lg text-white p-2 rounded-md min-w text-center flex items-center justify-center bg-[#2196f3]`}
									style={{ width: 40, height: 30, fontWeight: 'bold' }}
								>
									{getCombinedScore(m.userId as string)}
								</div>
							</div>
						</div>
					))}
			</CardContent>
		</Card>
	);
};

export default ContestLeaderboard;
