import ContestLeaderboard from '@/components/ContestLeaderboard';

export default async function LeaderboardPage({ params }: { params: Promise<{ contestId: string }> }) {
	const resolvedParams = await params;
	const contestId = resolvedParams.contestId;

	return <ContestLeaderboard contestId={contestId} />;
}
