import MembersList from '@/components/MembersList';

export default async function ParticipantsPage({ params }: { params: Promise<{ contestId: string }> }) {
	const resolvedParams = await params;
	const contestId = resolvedParams.contestId;

	return <MembersList contestId={contestId} />;
}
