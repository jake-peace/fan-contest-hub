'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { fetchEditionWithResults, fetchProfiles } from '../ResultsComponent';
import { Card } from '../ui/card';
import Image from 'next/image';
import { ArrowBigLeft, Phone, Users } from 'lucide-react';
import { Button } from '../ui/button';
import Loading from '../Loading';

interface BreakdownComponentProps {
	editionId: string;
}

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

const ResultsBreakdown: React.FC<BreakdownComponentProps> = ({ editionId }) => {
	const router = useRouter();

	const {
		data: edition,
		isLoading,
		isFetched,
	} = useQuery({
		queryKey: ['breakdownEditionDetails', editionId],
		queryFn: () => fetchEditionWithResults(editionId),
		refetchOnMount: 'always',
	});

	const { data: profiles, isLoading: isProfilesLoading } = useQuery({
		queryKey: ['breakdownProfiles', editionId],
		queryFn: () => fetchProfiles(editionId),
	});

	const getSubmissionScore = (submissionId: string): number => {
		let score = 0;
		edition?.rankingsList?.forEach((r) => {
			score = score + (rankingPoints.get(r.rankingList?.indexOf(submissionId) as number) as number);
		});
		return score;
	};

	const getTelevoteScore = (submissionId: string): number => {
		let score = 0;
		edition?.televoteList?.forEach((r) => {
			score = score + (rankingPoints.get(r.rankingList?.indexOf(submissionId) as number) as number);
		});
		return score;
	};

	if (isLoading || isProfilesLoading) {
		return <Loading />;
	}

	return (
		isFetched &&
		edition &&
		profiles && (
			<div className="m-1 space-y-1 align-center">
				<div className="flex items-center justify-between w-full relative">
					<Button variant="outline" size="icon" className="self-start" onClick={() => router.push(`/edition/${editionId}/results`)}>
						<ArrowBigLeft />
					</Button>
					<div className="absolute inset-0 flex justify-center items-center pointer-events-none">Breakdown of Results</div>
				</div>
				<Card className="max-w-[500px] md:max-w-[95%] md:p-2 rounded-md border-0 md:border">
					{/* <div className="overflow-x-auto"> */}
					<table className="min-w-fulls table-fixed">
						<thead>
							<tr>
								{/* --- FIXED SONG NAME COLUMN --- */}
								<th
									className="w-[12px] md:w-[240px] border text-[7.5px] md:text-lg"
									// style={{ minWidth: '120px', maxWidth: '120px' }} // Fallback for fixed width
								>
									Song
								</th>

								{/* --- DYNAMIC VOTER COLUMNS (Top) --- */}
								{edition.submissionList
									?.filter((s) => !s.rejected)
									.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))
									.map((voter) => (
										<th
											key={voter.userId}
											className="border max-w-[0.4rem] md:max-w-[0.8rem] items-center justify-center pt-0.5 md:px-1"
											// style={{ maxWidth: '0.25rem' }} // Small fixed width for score cells
										>
											<div className="w-2.5 h-2.5 md:w-5 md:h-5 mb-0.5 rounded-xs overflow-hidden relative justify-self-center">
												<Image
													src={`https://flagcdn.com/w320/${voter.flag?.toLowerCase()}.png`}
													fill
													alt={`${voter.artistName}'s flag`}
													style={{ objectFit: 'cover', objectPosition: 'center' }}
													quality={80}
													sizes="320px"
												/>
											</div>
											{/* Rotated Text for Voter Name (Downwards) */}
											<div className="text-[0.3rem] md:text-lg truncate overflow-hidden text-clip md:font-semibold">
												{profiles.find((p) => p.userId === voter.userId)?.displayName}
											</div>
										</th>
									))}
								<th
									className="border text-[7.5px] md:text-lg max-w-[10px]"
									// style={{ minWidth: '120px', maxWidth: '120px' }} // Fallback for fixed width
								>
									<div className="flex justify-center items-center ">
										<Users />
									</div>
								</th>
								<th
									className="border text-[7.5px] md:text-lg max-w-[10px]"
									// style={{ minWidth: '120px', maxWidth: '120px' }} // Fallback for fixed width
								>
									<div className="flex justify-center items-center ">
										<Phone className="" />
									</div>
								</th>
								<th
									className="border text-[7.5px] md:text-lg"
									// style={{ minWidth: '120px', maxWidth: '120px' }} // Fallback for fixed width
								>
									Total
								</th>
							</tr>
						</thead>

						<tbody className="max-w-screen">
							{edition.submissionList
								?.sort(
									(a, b) =>
										getSubmissionScore(b.submissionId) +
										getTelevoteScore(b.submissionId) -
										(getTelevoteScore(a.submissionId) + getSubmissionScore(a.submissionId))
								)
								.map((song) => (
									<tr key={song.submissionId} className="hover:bg-muted">
										{/* --- SONG NAME CELL (Left) --- */}
										<td className="border p-0.5 text-left text-[0.3rem] md:text-lg max-w-[50px] items-center md:pl-2">
											{/* Truncation applied here */}
											<div className="flex items-center">
												<div className="min-w-2.5 max-w-2.5 mr-0.5 h-2.5 md:min-w-5 md:max-w-5 md:h-5 rounded-xs overflow-hidden relative justify-self-center">
													<Image
														src={`https://flagcdn.com/w320/${song.flag?.toLowerCase()}.png`}
														fill
														alt={`${song.artistName}'s flag`}
														style={{ objectFit: 'cover', objectPosition: 'center' }}
														quality={80}
														sizes="320px"
													/>
												</div>
												<div className="truncate items-center md:pl-1">{song.songTitle}</div>
											</div>
										</td>

										{/* --- SCORE CELLS (Dynamic) --- */}
										{edition.submissionList
											?.filter((s) => !s.rejected)
											.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))
											.map((voter) => {
												const scoreObj = rankingPoints.get(
													edition.rankingsList?.find((r) => r.userId === voter.userId)?.rankingList?.indexOf(song.submissionId) as number
												);
												return (
													<td key={voter.userId} className="p-0.5 border">
														<div
															className={`rounded-xs text-[0.4rem] md:text-xl whitespace-no-wrap text-center ${getBadgeColor((edition.rankingsList?.find((r) => r.userId === voter.userId)?.rankingList?.indexOf(song.submissionId) as number) + 1)}`}
														>
															{/* Display the score number */}
															{scoreObj !== 0 ? scoreObj : ''}
														</div>
													</td>
												);
											})}

										{/* --- FINAL JURY SCORE --- */}
										<td className="border p-0.5 text-left text-[0.3rem] md:text-lg max-w-[50px] items-center">
											<div className={`rounded-xs text-[0.4rem] md:text-xl whitespace-no-wrap text-center font-bold`}>
												{/* Truncation applied here */}
												{getSubmissionScore(song.submissionId)}
											</div>
										</td>

										{/* --- FINAL TELE SCORE --- */}
										<td className="border p-0.5 text-left text-[0.3rem] md:text-lg max-w-[50px] items-center">
											<div className={`rounded-xs text-[0.4rem] md:text-xl whitespace-no-wrap text-center font-bold`}>
												{/* Truncation applied here */}
												{getTelevoteScore(song.submissionId)}
											</div>
										</td>

										{/* --- TOTAL SCORE --- */}
										<td className="border p-0.5 text-left text-[0.3rem] md:text-lg max-w-[50px] items-center">
											<div className={`rounded-xs text-[0.4rem] md:text-xl whitespace-no-wrap text-center font-bold`}>
												{/* Truncation applied here */}
												{getSubmissionScore(song.submissionId) + getTelevoteScore(song.submissionId)}
											</div>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</Card>
			</div>
		)
	);
};

export default ResultsBreakdown;
