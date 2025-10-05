import MembersList from '@/components/MembersList';

export default async function ParticipantsPage({ params }: { params: Promise<{ contestId: string }> }) {
	const resolvedParams = await params;
	const contestId = resolvedParams.contestId;

	return (
		<div className="min-h-screen bg-background p-4">
			<div className={'max-w-md mx-auto'}>
				<MembersList contestId={contestId} />
			</div>
		</div>
	);
}
