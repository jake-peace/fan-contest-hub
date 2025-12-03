import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../ui/spinner';
import { Badge } from '../ui/badge';
import { Schema } from '../../../amplify/data/resource';
import { SelectionSet } from 'aws-amplify/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const selectionSet = ['songTitle', 'artistName', 'submissionId', 'countryName', 'flag'] as const;
type Submission = SelectionSet<Schema['Submission']['type'], typeof selectionSet>;

export interface SubmissionWithScore extends Submission {
	score: number;
}

const fetchResults = async (id: string) => {
	const response = await fetch(`/api/editions/${id}/rankings`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.edition as SubmissionWithScore[];
};

interface ResultListParams {
	editionId: string;
	resultsRevealed: boolean;
}

const ResultsList: React.FC<ResultListParams> = ({ editionId, resultsRevealed }) => {
	const { data: edition, isLoading } = useQuery({
		queryKey: ['resultsList', editionId],
		queryFn: () => fetchResults(editionId),
	});
	const [visible, setVisible] = useState(false);

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

	if (isLoading) {
		return <Spinner />;
	}

	return (
		<div className="space-y-2 w-full">
			<Card className="mb-4 py-6 gap-2">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Scoreboard
						{resultsRevealed && (
							<Button className="ml-auto" variant="outline" onClick={() => setVisible(!visible)}>
								<>
									{visible ? <EyeOff /> : <Eye />}
									{visible ? 'Hide' : 'View'}
								</>
							</Button>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{visible
						? edition
								?.sort((a, b) => b.score - a.score)
								.map((song, index) => (
									<div
										key={song.submissionId}
										className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border mb-1`}
									>
										<div className="flex items-center justify-between gap-3">
											<div className="flex items-center gap-2">
												<Badge variant="secondary" className={getBadgeColor(index + 1)}>
													{index + 1}
												</Badge>
											</div>
											<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative">
												<Image
													src={`https://flagcdn.com/w640/${song.flag?.toLowerCase()}.png`}
													fill
													alt={`${song.countryName}'s flag`}
													style={{ objectFit: 'cover', objectPosition: 'center' }}
													quality={80}
													sizes="640px"
												/>
											</div>
											<div className="flex-1 truncate">
												<h3 className="font-medium truncate">{song?.songTitle}</h3>
												<p className="text-sm text-muted-foreground truncate">by {song?.artistName}</p>
											</div>
											<div
												className={`text-lg text-white p-2 rounded-md min-w text-center flex items-center justify-center bg-[#2196f3]`}
												style={{ width: 40, height: 30, fontWeight: 'bold' }}
											>
												{song.score}
											</div>
										</div>
									</div>
								))
						: !resultsRevealed
							? 'Scoreboard can be revealed after the host has viewed the results.'
							: 'Scoreboard hidden'}
				</CardContent>
			</Card>
		</div>
	);
};

export default ResultsList;
