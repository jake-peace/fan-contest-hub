import { SubmissionWithScore } from '.';
import { Schema } from '../../../amplify/data/resource';
import { Card } from '../ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Ranking = Schema['Ranking']['type'];
type Profile = Schema['Profile']['type'];

interface NewResultsTableProps {
	submissions: SubmissionWithScore[];
	rankings: Ranking[];
	name: string;
	profiles: Profile[];
}

const rankingPoints = new Map<number, number>([
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

const NewResultsTable: React.FC<NewResultsTableProps> = ({ submissions, rankings, name, profiles }) => {
	return (
		<Card className="m-5 p-2">
			<Table>
				<TableCaption>Results for {name}</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead className="w-5">Entry</TableHead>
						{rankings.map((r) => (
							<TableHead
								className="max-w-2.5 translate-y-[20] rotate-[-90deg] h-20 top-full flex-1 items-center align-center self-center origin-center"
								key={r.userId}
							>
								{profiles.find((p) => p.userId === r.userId)?.displayName}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{submissions.map((s) => (
						<TableRow key={s.submissionId}>
							<TableCell className="truncate max-w-25 text-xs">{`${s.songTitle} - ${s.artistName}`}</TableCell>
							{rankings.map((r) => (
								<TableCell key={`${s.submissionId}-${r.rankingId}`} className="w-5">
									<div className="bg-(--success) m-0.5 rounded-xss">
										{r.rankingList?.indexOf(s.submissionId) === -1
											? ''
											: rankingPoints.get(r.rankingList?.indexOf(s.submissionId) as number)}
									</div>
								</TableCell>
							))}
						</TableRow>
					))}
					{/* <TableRow>
						<TableCell className="font-medium">INV001</TableCell>
						<TableCell>Paid</TableCell>
						<TableCell>Credit Card</TableCell>
						<TableCell className="text-right">$250.00</TableCell>
					</TableRow> */}
				</TableBody>
			</Table>
		</Card>
	);
};

export default NewResultsTable;
