import TelevotePage from '@/components/TelevotePage';

export default async function EditionPage({ params }: { params: Promise<{ televoteId: string }> }) {
	const resolvedParams = await params;
	const televoteId = resolvedParams.televoteId;

	return <TelevotePage televoteId={televoteId} />;
}
