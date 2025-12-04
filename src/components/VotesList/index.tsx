import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../ui/spinner';
import { Badge } from '../ui/badge';
import { Alert } from '../ui/alert';
import { AlertTitle } from '../ui/alert';
import { AuthUser } from 'aws-amplify/auth';
import { Schema } from '../../../amplify/data/resource';
import { SelectionSet } from 'aws-amplify/api';

const rankingPoints = new Map<number, number>([
	[-1, 0],
	[0, 12],
	[1, 10],
	[2, 8],
	[3, 7],
	[4, 6],
	[5, 5],
	[6, 4],
	[7, 3],
	[8, 2],
	[9, 1],
]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const selectionSet = [
	'rankingList',
	'edition.submissions.songTitle',
	'edition.submissions.artistName',
	'edition.submissions.submissionId',
	'edition.submissions.countryName',
	'edition.submissions.flag',
] as const;
type Ranking = SelectionSet<Schema['Ranking']['type'], typeof selectionSet>;

const fetchUserRanking = async (id: string, userId: string) => {
	const response = await fetch(`/api/editions/${id}/rankings/${userId}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.ranking[0] as Ranking;
};

interface VotesListParams {
	editionId: string;
	user: AuthUser;
}

const VotesList: React.FC<VotesListParams> = ({ editionId, user }) => {
	const { data: ranking, isLoading } = useQuery({
		queryKey: ['votesList', editionId],
		queryFn: () => fetchUserRanking(editionId, user.userId),
	});

	const getBadgeColor = (rank: number) => {
		if (rank > 10) {
			return 'bg-(--destructive)';
		}
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

	if (isLoading) {
		return <Spinner />;
	}

	return ranking?.rankingList ? (
		ranking.rankingList?.map((s, index) => (
			<div key={s} className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border`}>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
						<Image
							src={`https://flagcdn.com/w640/${ranking.edition.submissions?.find((a) => a.submissionId === s)?.flag?.toLowerCase()}.png`}
							fill
							alt={`${ranking.edition.submissions?.find((a) => a.submissionId === s)?.countryName}'s flag`}
							style={{ objectFit: 'cover', objectPosition: 'center' }}
							quality={80}
							sizes="640px"
						/>
					</div>
					<div className="flex-1 truncate">
						<h3 className="font-medium truncate">{ranking.edition.submissions?.find((a) => a.submissionId === s)?.songTitle}</h3>
						<p className="text-sm text-muted-foreground truncate">
							by {ranking.edition.submissions?.find((a) => a.submissionId === s)?.artistName}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className={getBadgeColor(index + 1)}>
							{rankingPoints.get(index)}
						</Badge>
					</div>
				</div>
			</div>
		))
	) : (
		<Alert>
			<AlertTitle>You haven&apos;t voted yet</AlertTitle>
		</Alert>
	);
};

export default VotesList;
