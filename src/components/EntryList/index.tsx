import { useQuery } from '@tanstack/react-query';
import SubmissionCard from '../SubmissionCard';
import { Schema } from '../../../amplify/data/resource';
import { Spinner } from '../ui/spinner';

interface EntryListParams {
	contestId: string;
	userId: string;
}

type Submission = Schema['Submission']['type'];

const fetchParticipantEntries = async (id: string, userId: string) => {
	const response = await fetch(`/api/contest/${id}/entries/${userId}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.entries as Submission[];
};

export const EntryList: React.FC<EntryListParams> = ({ contestId, userId }) => {
	const { data: entries, isLoading } = useQuery({
		queryKey: ['contestParticipantEntries', userId],
		queryFn: () => fetchParticipantEntries(contestId, userId),
	});

	if (isLoading) {
		return <Spinner />;
	}

	return (
		entries &&
		entries
			.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
			.map((e) => (
				<SubmissionCard
					key={e.submissionId}
					submission={e}
					isHost={false}
					isUser={false}
					contestId={contestId}
					// score={e.score}
				/>
			))
	);
};
