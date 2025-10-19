import { SubmissionWithScore } from '.';
import { Schema } from '../../../amplify/data/resource';
import { Card } from '../ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import Image from 'next/image';

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
	console.log(submissions);
	return (
		<Card className="m-5 p-2">
			<Table>
				<TableCaption>Results for {name}</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead className="w-5">Entry</TableHead>
						{submissions
							.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))
							.map((r) => (
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
							<TableCell className="text-xs flex items-center my-1">
								<div className="w-5 h-5 rounded-sm overflow-hidden mr-2 ml-1.5 shadow-md relative">
									<Image
										src={`https://flagcdn.com/w640/${s.flag?.toLowerCase()}.png`}
										fill
										alt={`${s.artistName}'s flag`}
										style={{ objectFit: 'cover', objectPosition: 'center' }}
										quality={80}
										sizes="640px"
									/>
								</div>
								<div className="max-w-50 truncate ellipsis overflow-hidden">{`${s.songTitle} - ${s.artistName}`}</div>
							</TableCell>
							{submissions
								.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))
								.map((r, index) => (
									<TableCell key={`${s.submissionId}-${rankings[index].rankingId}`} className="w-5">
										<div className="bg-(--success) m-0.5 rounded-xss">
											{rankings.find((ranking) => ranking.userId === r.userId)?.rankingList?.indexOf(s.submissionId) === -1
												? ''
												: rankingPoints.get(
														rankings.find((ranking) => ranking.userId === r.userId)?.rankingList?.indexOf(s.submissionId) as number
													)}
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
