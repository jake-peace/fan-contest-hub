'use client';

import { Info, Pause, Play } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertTitle } from '../ui/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Schema } from '../../../amplify/data/resource';
import { Button } from '../ui/button';
import { AnimatePresence, motion } from 'motion/react';
import React, { startTransition, useEffect, useState } from 'react';
import { Progress } from '../ui/progress';
import { AuthUser } from 'aws-amplify/auth';
import Loading from '../Loading';
import { useRouter } from 'next/navigation';
import { hostRevealed } from '@/app/actions/hostRevealed';
import Image from 'next/image';
import { toast } from 'sonner';
import { EditionWithResults } from '@/app/api/editions/[editionId]/results/route';
import FinalOverlayCard from './FinalCard';

// type Vote = Schema['Vote']['type'];
type Submission = Schema['Submission']['type'];
type Profile = Schema['Profile']['type'];
type Ranking = Schema['Ranking']['type'];
type Televote = Schema['Televote']['type'];

interface ResultsComponentProps {
	editionId: string;
	user: AuthUser;
}

export interface SubmissionWithScore extends Submission {
	score: number;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const fetchProfiles = async (id: string) => {
	const response = await fetch(`/api/profile/${id}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.profiles.map((p: { data: unknown }) => p.data as Profile) as Profile[];
};

export const fetchEditionWithResults = async (id: string) => {
	const response = await fetch(`/api/editions/${id}/results`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.edition as EditionWithResults;
};

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

const lowRankingPoints = new Map<number, number>([
	[0, 7],
	[1, 6],
	[2, 5],
	[3, 4],
	[4, 3],
	[5, 2],
	[6, 1],
]);

export const tiebreakSorter = () => {
	try {
		// --- Counting Logic ---
		// Pre-calculate the count array [Count@Index0, Count@Index1, ..., Count@Index9]
		// const calculateCountArray = (id: string): number[] => {
		// 	// Initialize an array of 10 zeros
		// 	const counts = new Array<number>(10).fill(0);

		// 	// Iterate over every inner array in the external data
		// 	for (const innerArray of externalData) {
		// 		// Check the first 10 positions (index 0 to 9) of the current inner array
		// 		const limit = Math.min(innerArray.length, 10);

		// 		for (let i = 0; i < limit; i++) {
		// 			if (innerArray[i] === id) {
		// 				// Increment the count for that specific index (i)
		// 				counts[i]++;
		// 			}
		// 		}
		// 	}
		// 	return counts;
		// };

		// Cache to store the pre-calculated count array for each ID
		// const idCountCache = new Map<string, number[]>();

		// const getCountArray = (id: string): number[] => {
		// 	if (idCountCache.has(id)) {
		// 		return idCountCache.get(id)!;
		// 	}
		// 	const countArray = calculateCountArray(id);
		// 	idCountCache.set(id, countArray);
		// 	return countArray;
		// };

		// --- The Comparison Function ---
		const complexSorter = (a: SubmissionWithScore, b: SubmissionWithScore): number => {
			// 1. Primary Sort: Score (Descending)
			const comparison = b.score - a.score;
			if (comparison !== 0) {
				return comparison;
			}

			// --- 2. Secondary Sort: Sequential ID Count (Descending) ---
			// const aCounts = getCountArray(a.submissionId);
			// const bCounts = getCountArray(b.submissionId);

			// // Iterate from index 0 up to 9
			// for (let i = 0; i < 10; i++) {
			// 	// Compare the counts at the current index (Descending)
			// 	comparison = bCounts[i] - aCounts[i];

			// 	// If the counts are different, this is our tie-breaker—return the result immediately
			// 	if (comparison !== 0) {
			// 		return comparison;
			// 	}
			// 	// If they are equal (comparison === 0), the loop continues to the next index (i+1)
			// }

			// 3. Tertiary Sort: RunningOrder (Ascending)
			// This is only reached if score and ALL 10 sequential counts were identical
			return (a.runningOrder as number) - (b.runningOrder as number);
		};
		return complexSorter;
	} catch (error) {
		console.log('Error while sorting songs:', JSON.stringify(error));
	}
};

const ResultsComponent: React.FC<ResultsComponentProps> = ({ editionId, user }) => {
	const [submissions, setSubmissions] = useState<SubmissionWithScore[]>([]);
	const [votingIndex, setVotingIndex] = useState(-1);
	const [pointsJustReceived, setPointsJustReceived] = useState<Record<string, number>>({});
	const [currentVoter, setCurrentVoter] = useState<string | null>(null);
	const [lowPointList, setLowPointList] = useState<string[]>([]);
	const [highPointMessage, setHighPointMessage] = useState<string | undefined>();
	const [isMobile, setIsMobile] = useState(false);
	const [finalPoints, setFinalPoints] = useState(0);
	const [resultsStage, setResultsStage] = useState<'JURY' | 'TELEVOTE' | 'COMPLETE'>('JURY');
	const [receivedTelevotes, setReceivedTelevotes] = useState<string[]>([]);
	const [showFinalOverlay, setShowFinalOverlay] = useState<boolean>(false);
	const [finalSongToReveal, setFinalSongToReveal] = useState<SubmissionWithScore>();
	const [leader, setCurrentLeader] = useState<SubmissionWithScore>();
	const [paused, setPaused] = useState(false);
	const [juryVotes, setJuryVotes] = useState<Ranking[]>([]);
	const [televotes, setTelevotes] = useState<Televote[]>([]);

	const submissionOrder = [...submissions].sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number));

	const router = useRouter();
	const queryClient = useQueryClient();

	const {
		data: edition,
		isLoading,
		isFetched,
		isRefetching,
	} = useQuery({
		queryKey: ['resultsEditionDetails', editionId],
		queryFn: () => fetchEditionWithResults(editionId),
		refetchOnMount: 'always',
	});

	const { data: profiles, isLoading: isProfilesLoading } = useQuery({
		queryKey: ['resultsProfiles', editionId],
		queryFn: () => fetchProfiles(editionId),
	});

	useEffect(() => {
		if (isFetched && edition) {
			setSubmissions(
				(edition.submissionList as Submission[])
					.filter((s) => s.rejected !== true)
					.map((s) => ({ ...s, score: 0 }))
					.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))
			);
			if ((edition.submissionList as Submission[]).length === 0 || edition.rankingsList?.length === 0) {
				console.log(edition.submissionList);
				toast.error(`Failed to find votes`);
				router.push(`/edition/${editionId}`);
			}
			setJuryVotes(edition.rankingsList as Ranking[]);
			setTelevotes(edition.televoteList);
		}
	}, [isFetched]);

	// useEffect(() => {
	// 	if (edition?.rankingsList && isFetched) {
	// 		const usersWithSongs = edition?.submissionList?.map((s) => s.userId as string);
	// 		let tempTelevotes: { submissionId: string; points: number }[] = [];
	// 		// edition.rankingsList?.filter((r) => !usersWithSongs?.includes(r.userId as string)).forEach((song, index) => {
	// 		// 	tempTelevotes = [
	// 		// 		...tempTelevotes,
	// 		// 		{ submissionId: song, points:  }
	// 		// 	]
	// 		// })
	// 		edition?.submissionList?.forEach((s) => {
	// 			edition.rankingsList.filter((r) => !usersWithSongs?.includes(r.userId as string) && )
	// 		});
	// 		setTelevotes(tempTelevotes);
	// 		setJuryVotes(votes.filter((v) => usersWithSongs?.includes(v.fromUserId)));
	// 	}
	// }, [isVotesFetched]);

	const allPoints = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

	// Add a constant for the column limit
	const MAX_SONGS_PER_COLUMN = 15;
	const SONG_CARD_HEIGHT = 35;

	const handleSkipJury = () => {
		if (juryVotes) {
			// const updatedSongs = [...submissions];

			const updatedSongs = [...submissions];
			juryVotes.forEach((v) => {
				v.rankingList?.forEach((song, index) => {
					const songToUpdate = updatedSongs.find((s) => s.submissionId === song);
					if (songToUpdate) {
						songToUpdate.score += rankingPoints.get(index) as number;
					}
				});
			});
			setSubmissions(updatedSongs.sort(tiebreakSorter()));
		}
		setResultsStage('TELEVOTE');
		setVotingIndex(20);
		setCurrentVoter('a');
	};

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768); // Tailwind's `md` breakpoint
		};
		window.addEventListener('resize', handleResize);
		handleResize();
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleHostRevealed = () => {
		startTransition(async () => {
			await hostRevealed(editionId);
			queryClient.invalidateQueries({ queryKey: ['editionDetails', editionId] });
		});
	};

	useEffect(() => {
		// This function will run when a new voter appears
		const runRevealSequence = async () => {
			if (edition?.contestDetails.hostId === user.userId && edition?.resultsRevealed !== true) {
				handleHostRevealed();
			}
			console.log(votingIndex);
			// ✨ Check if all jury votes are revealed
			if (isFetched && votingIndex >= submissions.length - 1) {
				console.log('all jury votes revealed.');
				runTelevoteSequence();
				return;
			}

			console.log(currentVoter);
			if (!currentVoter || currentVoter === 'failed') return;

			// Reset state for a clean slate
			setPointsJustReceived({});
			setLowPointList([]);
			setHighPointMessage(undefined);

			const voterVotes = juryVotes.find((v) => v.userId === currentVoter);
			const lowPointVotes = voterVotes?.rankingList?.slice(3) as string[];
			const highPointVotes = voterVotes?.rankingList?.slice(0, 3) as string[];

			// --- Step 1: Voter card and 1-7 list appear immediately ---
			await delay(1500);
			setLowPointList(lowPointVotes);

			// --- Step 2: Delay for 1 second ---
			await delay(2500);

			// --- Step 3: Apply 1-7 points to the scoreboard ---
			const updatedSongs = [...submissions];
			const newSongsWithPoints = new Set<string>();
			const newPointsReceived: Record<string, number> = {};
			lowPointVotes.forEach((vote, index) => {
				const songToUpdate = updatedSongs.find((s) => s.submissionId === vote);
				if (songToUpdate) {
					songToUpdate.score += lowRankingPoints.get(index) as number;
					newSongsWithPoints.add(vote);
					newPointsReceived[vote] = lowRankingPoints.get(index) as number;
				}
			});
			setPointsJustReceived((prev) => ({ ...prev, ...newPointsReceived }));

			setSubmissions(updatedSongs.sort(tiebreakSorter()));

			// --- Step 4: Add a delay *between* the 1-7 and the high points ---
			await delay(3500);

			// --- Step 5: Reveal 8, 10, and 12 points with delays in between ---
			for (let i = 2; i >= 0; i--) {
				const points = rankingPoints.get(i) as number;
				const updatedSongs = [...submissions];
				const songToUpdate = updatedSongs.find((s) => s.submissionId === highPointVotes[i]);
				if (songToUpdate) {
					setHighPointMessage(`${points} points goes to...`);
					await delay(2500);
					songToUpdate.score += points;
					setHighPointMessage(`${songToUpdate?.songTitle} by ${songToUpdate?.artistName}!`);
					setPointsJustReceived((prev) => ({ ...prev, [highPointVotes[i]]: points }));
					await delay(1500);
					// setSubmissions(updatedSongs.sort(tiebreakSorter(edition?.rankingsList?.map((r) => r.rankingList as string[]) as string[][])));
					setSubmissions(updatedSongs.sort(tiebreakSorter()));
					await delay(2500);
				}
			}

			// --- Step 6: End of round, wait and move to next voter ---
			await delay(2500);
			setCurrentVoter(null);
			setVotingIndex((prev) => prev + 1);
			setLowPointList([]);
		};

		// ✨ New async function for the televote sequence
		const runTelevoteSequence = async () => {
			if (televotes.length === 0 || !televotes) {
				setHighPointMessage('No televotes found for this edition!');
				setResultsStage('COMPLETE');
				setHighPointMessage(
					`Congratulations to ${profiles?.find((p) => p.userId === submissions[0].userId)?.displayName} with the song ${submissions[0].songTitle} by ${submissions[0].artistName}!`
				);
				return;
			}
			setReceivedTelevotes([]);
			setLowPointList([]);
			setHighPointMessage('Starting televote sequence...');
			setResultsStage('TELEVOTE');

			// Sort songs from lowest to highest jury score
			const sortedSongsByJuryScore = [...submissions].reverse();

			console.log(sortedSongsByJuryScore);
			console.log(televotes);

			await delay(1000);

			// Loop through each song to reveal its televote points
			for (let i = 0; i < sortedSongsByJuryScore.length; i++) {
				const song = sortedSongsByJuryScore[i];
				let telePoints = 0;
				edition?.televoteList.forEach((t) => {
					telePoints = (telePoints + (rankingPoints.get(t.rankingList?.indexOf(song.submissionId) as number) as number)) as number;
				});

				if (isNaN(telePoints)) {
					telePoints = 0;
				}

				// const televoteData = televotes.find((vote) => vote.submissionId === song.submissionId);
				const finalReveal = i === sortedSongsByJuryScore.length - 1;

				if (finalReveal) {
					setHighPointMessage(undefined);
					// ✨ Corrected Logic: Find the leader from songs NOT including the final song
					const finalSongId = song.submissionId;
					const contenders = submissions.filter((s) => s.submissionId !== finalSongId);
					const leader = [...contenders].sort((a, b) => b.score - a.score)[0];

					setFinalSongToReveal(song);
					setCurrentLeader(leader);
					setFinalPoints(telePoints);
					if (leader.score > song.score) {
						setShowFinalOverlay(true);
					}
					await delay(5500);
					setPointsJustReceived({ [song.submissionId]: telePoints });
					const updatedSongs = [...submissions];
					const songToUpdate = updatedSongs.find((s) => s.submissionId === song.submissionId);
					if (songToUpdate) {
						songToUpdate.score += telePoints;
					}
					setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
					await delay(2000);
					setReceivedTelevotes((prev) => [...prev, song.submissionId]);
					setPointsJustReceived({});
					setResultsStage('COMPLETE');
					setReceivedTelevotes([]);
					setHighPointMessage(`Congratulations to ${updatedSongs[0].songTitle} by ${updatedSongs[0].artistName}!`);
				}

				if (!finalReveal) {
					setHighPointMessage(`${song.songTitle} receives...`);
					await delay(2000);
					setHighPointMessage(`${telePoints} points!`);
					await delay(500);
					setPointsJustReceived({ [song.submissionId]: telePoints });
					await delay(500);
					const updatedSongs = [...submissions];
					const songToUpdate = updatedSongs.find((s) => s.submissionId === song.submissionId);
					if (songToUpdate) {
						songToUpdate.score += telePoints;
					}
					setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
					// todo: grey out a song if it's received televote points
					await delay(2000);
					setReceivedTelevotes((prev) => [...prev, song.submissionId]);
					setPointsJustReceived({}); // Clear points for the next song
				}

				if (finalReveal) {
					await delay(4000);
					setShowFinalOverlay(false);
				} else {
					await delay(20);
				}
			}
		};

		runRevealSequence();

		return () => {
			setPointsJustReceived({});
		};
	}, [currentVoter]);

	// This useEffect handles the transition between voters
	useEffect(() => {
		if (!paused) {
			if (votingIndex === -1) {
				const nextVoterId =
					submissions.length > 0 &&
					[...submissions].sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))[votingIndex].userId;
				const voterVotesExist = juryVotes?.some((vote) => vote.userId === (nextVoterId as string));
				if (voterVotesExist) {
					setCurrentVoter(nextVoterId as string);
				}
			} else if (currentVoter === null && votingIndex > -1 && votingIndex <= submissionOrder.length) {
				const startNextRoundTimer = setTimeout(() => {
					const submissionsCopy = [...submissions];
					const nextVoterId = submissionsCopy.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))[votingIndex].userId;
					const voterVotesExist = juryVotes?.some((vote) => vote.userId === nextVoterId);
					if (voterVotesExist) {
						setCurrentVoter(nextVoterId as string);
					} else {
						toast.error(`Failed to find any votes from ${profiles?.find((p) => p.userId === nextVoterId)?.displayName}`);
						delay(2000);
						setCurrentVoter(null);
						if (votingIndex !== submissions.length - 1) {
							setVotingIndex((prev) => prev + 1);
						} else {
							setCurrentVoter('failed');
						}
					}
				}, 1000);
				return () => clearTimeout(startNextRoundTimer);
			}
		} else {
			setHighPointMessage('Reveal is paused');
		}
	}, [currentVoter, votingIndex, paused]);

	if (isLoading || isProfilesLoading || isRefetching) {
		return <Loading />;
	}

	const renderSongCard = (song: SubmissionWithScore, index: number) => {
		const points = pointsJustReceived[song.submissionId];

		const isRightColumn = !isMobile && index >= MAX_SONGS_PER_COLUMN;
		const topOffset = isMobile ? index * SONG_CARD_HEIGHT : (isRightColumn ? index - MAX_SONGS_PER_COLUMN : index) * SONG_CARD_HEIGHT;
		const leftOffset = isMobile ? 0 : isRightColumn ? 50 : 0;
		const cardWidth = isMobile ? '100%' : '50%';

		return (
			<motion.li
				key={song.submissionId}
				layout
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
				transition={{ type: 'spring', stiffness: 150, damping: 30, mass: 1 }}
				className={`absolute w-full md:w-1/2`}
				style={{ top: topOffset, left: `${leftOffset}%`, width: cardWidth }}
			>
				<Card
					className={`backdrop-blur-sm m-0 mx-0.5 rounded-lg shadow-xl bg-card text-card-foreground ${song.userId === currentVoter || receivedTelevotes.includes(song.submissionId) ? 'opacity-50 transition-opacity' : ''}`}
					// className={`backdrop-blur-sm m-0 mx-0.5 rounded-lg shadow-xl bg-card text-card-foreground ${song.userId === currentVoter ? 'opacity-50 transition-opacity' : ''}`}
				>
					<CardContent className="flex items-center p-0">
						{/* Flag on the left */}
						<div className="w-5 h-5 rounded-sm overflow-hidden mr-2 ml-1.5 shadow-md relative">
							<Image
								src={`https://flagcdn.com/w640/${song.flag?.toLowerCase()}.png`}
								fill
								alt={`${song.artistName}'s flag`}
								style={{ objectFit: 'cover', objectPosition: 'center' }}
								quality={80}
								sizes="640px"
							/>
						</div>

						{/* Song Title and Artist */}
						<div className="flex-1 flex gap-2 min-w-0">
							<div className="text-sm font-semibold truncate">{song.songTitle}</div>
							<div className="text-sm text-muted-foreground truncate pr-1">{song.artistName}</div>
						</div>

						{/* Points received and total points */}
						<div className="flex items-center space-x-3 mr-1.5">
							<AnimatePresence>
								{(points || points == 0) && (
									<motion.div
										key={song.submissionId}
										initial={{ opacity: 0, y: -20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ type: 'spring', stiffness: 400, damping: 30 }}
										className={`text-lg text-white p-2 rounded-md min-w text-center flex items-center justify-center ${points === 12 && resultsStage === 'JURY' ? 'bg-[#9c27b0]' : 'bg-[#2196f3]'}`}
										style={{ width: 40, height: 30, fontWeight: 'bold' }}
									>
										{points}
									</motion.div>
								)}
							</AnimatePresence>
							<div className="text-lg font-bold text-center flex items-center justify-center" style={{ width: 30, height: 30 }}>
								{song.score}
							</div>
						</div>
					</CardContent>
					{/* ✨ The Flash Animation Overlay */}
					{((points === 12 && resultsStage === 'JURY') || (index === 0 && resultsStage === 'COMPLETE')) && (
						// (index === 0 && resultsStage === 'TELEVOTE' && receivedTelevotes.includes(song.submissionId))) && (
						<motion.div
							initial={{ backgroundPosition: '-200% 0%' }} // Start the gradient far to the left
							animate={{ backgroundPosition: '200% 0%' }} // Animate it across the card
							transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
							className="absolute inset-0 z-10 rounded-lg" // ✨ Added `rounded-lg` here
							style={{
								// Use a gradient with transparent edges
								backgroundImage: `linear-gradient(90deg, 
                                rgba(255, 215, 0, 0) 0%, 
                                rgba(255, 215, 0, 0.4) 50%, 
                                rgba(255, 215, 0, 0) 100%
                            )`,
								backgroundSize: '200% 100%', // Makes the gradient twice as wide as the card
								backgroundRepeat: 'no-repeat',
								pointerEvents: 'none', // Critical: ensures the overlay doesn't block clicks
							}}
						/>
					)}
				</Card>
			</motion.li>
		);
	};

	return (
		<div className="p-1 max-w-6xl mx-auto flex flex-col md:space-x-8 mt-2">
			<div className="flex">
				<Button variant="ghost" className="mb-4" onClick={() => router.back()}>
					← Back
				</Button>
			</div>

			<div className="flex gap-2 mb-2">
				{votingIndex >= 0 && resultsStage === 'JURY' ? (
					<Button
						onClick={() => setPaused(!paused)}
						className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
					>
						{paused ? <Play /> : <Pause />}
						{paused ? 'Resume Reveal' : 'Pause Reveal'}
					</Button>
				) : (
					resultsStage !== 'COMPLETE' && (
						<>
							<Button
								onClick={() => setVotingIndex(0)}
								className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
							>
								<Play />
								Start Reveal
							</Button>
							<Button
								onClick={handleSkipJury}
								// disabled
								className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
							>
								Skip jury sequence
							</Button>
						</>
					)
				)}
				{<Button onClick={() => router.push(`/edition/${editionId}/results/breakdown`)}>See breakdown of results</Button>}
			</div>
			{paused && (
				<Alert>
					<Info />
					<AlertTitle>Reveal will only pause after the current juror&apos;s votes are revealed.</AlertTitle>
				</Alert>
			)}
			{/* Main content area: Voter Card + Scoreboard Columns */}
			<div className="flex w-full mt-2 space-x-2 flex-col md:flex-row w-full mt-2 md:space-x-4">
				{/* Fixed Voter Card Container */}
				<div className="w-full min-w-[200px] md:w-1/4 flex-shrink-0 relative">
					{resultsStage === 'JURY' && (
						<Card className="px-8 py-8 mb-2 rounded-xl shadow-xl bg-card text-card-foreground text-center justify-center">
							<AnimatePresence mode="wait">
								{currentVoter ? (
									<motion.div
										key={currentVoter}
										initial={{ opacity: 0, y: -20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 20 }}
										transition={{ type: 'spring', stiffness: 300, damping: 25 }}
										className="flex flex-col items-center justify-center h-full"
									>
										<div className="flex w-full justify-between">
											<div className="w-8 h-8 min-w-8 max-w-8 rounded-md overflow-hidden shadow-md relative">
												<Image
													src={`https://flagcdn.com/w640/${submissionOrder[votingIndex].flag?.toLowerCase()}.png`}
													fill
													alt={`${submissionOrder[votingIndex].artistName}'s flag`}
													style={{ objectFit: 'cover', objectPosition: 'center' }}
													quality={80}
													sizes="640px"
												/>
											</div>
											<h2 className="text-2xl font-bold">{profiles?.find((p) => p.userId === currentVoter)?.displayName}</h2>
										</div>
									</motion.div>
								) : (
									<motion.div
										key="placeholder"
										initial={{ opacity: 0 }}
										animate={{ opacity: 0 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.1 }}
									>
										{/* Empty div to maintain space during transition */}
									</motion.div>
								)}
							</AnimatePresence>
							<div className="flex w-full justify-between max-w-full">
								<AnimatePresence>
									{currentVoter &&
										allPoints.map((p, index) => {
											// Determine if the square should be the solid/filled version
											const isSolid = !Object.values(pointsJustReceived).includes(p);

											// Define dynamic colors based on the value of 'p'
											const solidBg = p === 12 ? 'rgba(156, 39, 176, 1)' : 'rgba(33, 149, 243, 1)';
											const borderColorRgb = p === 12 ? 'rgb(156, 39, 176)' : 'rgb(33, 150, 243)';

											return (
												<div key={index} className="flex w-full justify-between">
													<motion.div
														// 🚨 CRITICAL: Use index as the key. We are NOT conditionally rendering.
														key={index}
														// Use a single 'animate' prop to handle both the entry and the state change
														animate={{
															// 1. Movement and Opacity (Entry/Exit style)
															opacity: 1, // Always visible
															y: 0, // Resting position

															// 2. Color and Border (The Transition)
															backgroundColor: isSolid ? solidBg : 'rgba(0, 0, 250, 0)',
															borderColor: borderColorRgb,
															borderWidth: isSolid ? 0 : 1,
														}}
														// Define the entry animation (Starts from invisible/above)
														initial={{ opacity: 0, y: -20, backgroundColor: solidBg, borderWidth: 0 }}
														transition={{
															duration: 1,
															// Apply spring to y/opacity, and smooth timing to colors/border
															y: { type: 'spring', stiffness: 400, damping: 30 },
															opacity: { type: 'spring', stiffness: 400, damping: 30 },
															backgroundColor: { duration: 0.5 },
															borderColor: { duration: 0.5 },
															borderWidth: { duration: 0.5 },
														}}
														exit={{ opacity: 0 }}
														style={{
															width: 20,
															height: 20,
															fontWeight: 'bold',
															// Initialize static border style
															borderStyle: 'solid',
														}}
														className={`text-sm m-0.25 p-2 rounded-sm min-w text-center flex items-center justify-center`}
													>
														{p}
													</motion.div>
												</div>
											);
										})}
								</AnimatePresence>
							</div>
							<Progress value={((votingIndex + 1) / submissionOrder.length) * 100} />
							<div className="flex w-full justify-between">
								<div className="text-xs">{`Juror ${votingIndex + 1} of ${submissionOrder.length}`}</div>
							</div>
						</Card>
					)}

					{/* ✨ New List Component for 1-7 Points */}
					<AnimatePresence>
						{(lowPointList.length > 0 || highPointMessage) && (
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
								{highPointMessage ? (
									<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
										<Card className="py-4 shadow-xl bg-card text-card-foreground">
											<CardContent>
												<motion.ul className="list-none p-0">
													<motion.li
														initial={{ opacity: 0, x: -20 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{ delay: 0.1 }}
														className="flex justify-between items-center my-1 text-sm font-medium"
													>
														<span className="font-bold text-lg">{highPointMessage}</span>
													</motion.li>
												</motion.ul>
											</CardContent>
										</Card>
									</motion.div>
								) : (
									<motion.ul className="list-none p-0">
										{lowPointList.map((vote, index) => {
											const song = submissions.find((s) => s.submissionId === vote);
											if (!song) return null;
											return (
												<motion.li
													key={vote}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: index * 0.2 }}
												>
													<Card
														// className={`backdrop-blur-sm shadow-xl bg-card text-card-foreground m-0 mb-1 rounded-lg ${song.userId === currentVoter || receivedTelevotes.includes(song.submissionId) ? 'opacity-50 transition-opacity' : ''}`}
														className={`backdrop-blur-sm shadow-xl bg-card text-card-foreground m-0 mb-1 rounded-lg ${song.userId === currentVoter ? 'opacity-50 transition-opacity' : ''}`}
													>
														<CardContent className="flex items-center p-0">
															{/* Flag on the left */}
															<div className="w-5 h-5 rounded-lg overflow-hidden mr-4 ml-2 shadow-md relative">
																<Image
																	src={`https://flagcdn.com/w640/${song.flag?.toLowerCase()}.png`}
																	fill
																	alt={`${song.artistName}'s flag`}
																	style={{ objectFit: 'cover', objectPosition: 'center' }}
																	quality={80}
																	sizes="640px"
																/>
															</div>

															{/* Song Title and Artist */}
															<div className="flex-1 flex gap-2 min-w-0">
																<div className="text-sm font-semibold truncate">{song.songTitle}</div>
																<div className="text-sm text-muted-foreground truncate pr-1">{song.artistName}</div>
															</div>
															<span
																className="font-bold text-lg text-lg text-white rounded-md text-center flex items-center justify-center bg-[#2196f3]"
																style={{ minWidth: 30, height: 30 }}
															>
																{lowRankingPoints.get(index)}
															</span>
														</CardContent>
													</Card>
												</motion.li>
											);
										})}
									</motion.ul>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* The single scoreboard container */}
				<div className="relative w-full md:w-3/4 mt-8 md:mt-0">
					<motion.ul
						layout
						className="relative w-full list-none p-0"
						style={{
							height: isMobile ? `${submissions.length * SONG_CARD_HEIGHT}px` : `${Math.ceil(submissions.length / 2) * SONG_CARD_HEIGHT}px`,
						}}
					>
						{submissions.map(renderSongCard)}
					</motion.ul>
				</div>

				{/* ✨ The Final Reveal Overlay Component */}
				{showFinalOverlay && (
					<FinalOverlayCard
						leaderSong={leader as SubmissionWithScore}
						stillToScoreSong={finalSongToReveal as SubmissionWithScore}
						finalPoints={finalPoints}
						onAnimationEnd={() => setShowFinalOverlay(false)}
					/>
				)}
			</div>
		</div>
	);
};

export default ResultsComponent;
