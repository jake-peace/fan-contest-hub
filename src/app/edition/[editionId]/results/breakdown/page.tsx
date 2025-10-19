import ResultsBreakdown from '@/components/ResultsBreakdown';

export default async function BreakdownPage({ params }: { params: Promise<{ editionId: string }> }) {
	const resolvedParams = await params;
	const editionId = resolvedParams.editionId;

	return <ResultsBreakdown editionId={editionId} />;
}
