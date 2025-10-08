'use client';

import { Info, Pause, Play, Vote } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertTitle } from '../ui/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Schema } from '../../../amplify/data/resource';
import { Button } from '../ui/button';
import { AnimatePresence, motion } from 'motion/react';
import React, { startTransition, useEffect, useState } from 'react';
import { Progress } from '../ui/progress';
import FinalOverlayCard from './FinalCard';
import JuryPivotTable from './ResultsTable';
import { AuthUser } from 'aws-amplify/auth';
import { fetchEditionVotes } from '../VotingComponent';
import { fetchEdition } from '../EditionDetails';
import Loading from '../Loading';
import { useRouter } from 'next/navigation';
import { hostRevealed } from '@/app/actions/hostRevealed';
import Image from 'next/image';
import { toast } from 'sonner';

type Vote = Schema['Vote']['type'];
type Submission = Schema['Submission']['type'];
type Profile = Schema['Profile']['type'];

interface ResultsComponentProps {
	editionId: string;
	user: AuthUser;
}

// function generateMockTele(submissionIds: string[]) {
// 	const mockTele: { submissionId: string; points: number }[] = [];
// 	submissionIds.forEach((s) => {
// 		mockTele.push({
// 			submissionId: s,
// 			points: Math.floor(Math.random() * (120 - 0 + 1) + 0),
// 		});
// 	});
// 	return mockTele;
// }
interface Song {
	submissionId: string;
	songTitle: string;
	artistName: string;
	userId: string;
	score: number;
	flag: string;
}

interface SubmissionWithScore extends Submission {
	score: number;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const fetchProfiles = async (id: string) => {
	const response = await fetch(`/api/profile/${id}`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.profiles.map((p: { data: unknown }) => p.data as Profile) as Profile[];
};

const ResultsComponent: React.FC<ResultsComponentProps> = ({ editionId, user }) => {
	const [submissions, setSubmissions] = useState<SubmissionWithScore[]>([]);
	const [votingIndex, setVotingIndex] = useState(-1);
	const [pointsJustReceived, setPointsJustReceived] = useState<Record<string, number>>({});
	const [currentVoter, setCurrentVoter] = useState<string | null>(null);
	const [lowPointList, setLowPointList] = useState<Vote[]>([]);
	const [highPointMessage, setHighPointMessage] = useState<string | undefined>();
	const [isMobile, setIsMobile] = useState(false);
	const [resultsStage, setResultsStage] = useState<'JURY' | 'TELEVOTE' | 'COMPLETE'>('JURY');
	const [receivedTelevotes, setReceivedTelevotes] = useState<string[]>([]);
	const [showFinalOverlay, setShowFinalOverlay] = useState<boolean>(false);
	const [finalSongToReveal, setFinalSongToReveal] = useState<SubmissionWithScore>();
	const [leader, setCurrentLeader] = useState<SubmissionWithScore>();
	const [viewBreakdown, setViewBreakdown] = useState(false);
	const [paused, setPaused] = useState(false);
	const [televotes, setTelevotes] = useState<{ submissionId: string; points: number }[]>([]);
	const [juryVotes, setJuryVotes] = useState<Vote[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const router = useRouter();
	const queryClient = useQueryClient();

	const {
		data: edition,
		isLoading,
		isFetched,
	} = useQuery({
		queryKey: ['resultsEditionDetails', editionId],
		queryFn: () => fetchEdition(editionId),
	});

	const { data: votes, isFetched: isVotesFetched } = useQuery({
		queryKey: ['resultsEditionVotes', editionId],
		queryFn: () => fetchEditionVotes(editionId),
		enabled: isFetched,
	});

	const { data: profiles, isLoading: isProfilesLoading } = useQuery({
		queryKey: ['resultsProfiles', editionId],
		queryFn: () => fetchProfiles(editionId),
	});

	useEffect(() => {
		if (isFetched && edition) {
			setSubmissions(edition.fulfilledSubmissions.map((s) => ({ ...s, score: 0 })));
			if (edition.fulfilledSubmissions.length === 0) {
				toast.error(`Failed to find votes`);
				router.push(`/edition/${editionId}`);
			}
		}
	}, [isFetched, isVotesFetched]);

	useEffect(() => {
		if (isVotesFetched && votes && isFetched) {
			const usersWithSongs = edition?.fulfilledSubmissions.map((s) => s.userId as string);
			const usersWithoutSongs = edition?.fulfilledContest.participants?.filter((p) => !usersWithSongs?.includes(p));
			let tempTelevotes: { submissionId: string; points: number }[] = [];
			edition?.fulfilledSubmissions.forEach((s) => {
				// const songTelevotes = votes.filter((v) => usersWithoutSongs?.includes(v.fromUserId));
				const songTelevotes = votes.filter((v) => v.submissionId === s.submissionId && usersWithoutSongs?.includes(v.fromUserId));
				tempTelevotes = [
					...tempTelevotes,
					{ submissionId: s.submissionId, points: songTelevotes.map((s) => s.points).reduce((sum, current) => sum + current, 0) },
				];
				// setTelevotes([
				// 	...televotes,
				// 	{ submissionId: s.submissionId, points: songTelevotes.map((s) => s.points).reduce((sum, current) => sum + current, 0) },
				// ]);
			});
			setTelevotes(tempTelevotes);
			setJuryVotes(votes.filter((v) => usersWithSongs?.includes(v.fromUserId)));
		}
	}, [isVotesFetched]);

	const allPoints = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

	// Add a constant for the column limit
	const MAX_SONGS_PER_COLUMN = 15;
	const SONG_CARD_HEIGHT = 35;

	const handleSkipJury = () => {
		if (juryVotes) {
			juryVotes.forEach((v) => {
				const updatedSongs = [...submissions];
				const songToUpdate = submissions.find((s) => s.submissionId === v.submissionId);
				if (songToUpdate) {
					songToUpdate.score += v.points;
				}
				setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
			});
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
			if (edition?.fulfilledContest.hostId === user.userId && edition?.resultsRevealed !== true) {
				handleHostRevealed();
			}
			// ✨ Check if all jury votes are revealed
			if (votingIndex >= submissions.length) {
				runTelevoteSequence();
				return;
			}

			if (!currentVoter) return;

			// Reset state for a clean slate
			setPointsJustReceived({});
			setLowPointList([]);
			setHighPointMessage(undefined);

			const voterVotes = juryVotes?.filter((vote) => vote.fromUserId === currentVoter);
			const sortedVotes = [...(voterVotes as Vote[])].sort((a, b) => a.points - b.points);
			const lowPointVotes = sortedVotes.filter((vote) => vote.points < 8);
			const highPointVotes = sortedVotes.filter((vote) => vote.points >= 8).sort((a, b) => a.points - b.points);

			console.log(highPointVotes);

			// --- Step 1: Voter card and 1-7 list appear immediately ---
			await delay(1000);
			setLowPointList(lowPointVotes.sort((a, b) => b.points - a.points));

			// --- Step 2: Delay for 1 second ---
			await delay(2000);

			// --- Step 3: Apply 1-7 points to the scoreboard ---
			const updatedSongs = [...submissions];
			const newSongsWithPoints = new Set<string>();
			const newPointsReceived: Record<string, number> = {};
			lowPointVotes.forEach((vote) => {
				const songToUpdate = updatedSongs.find((s) => s.submissionId === vote.submissionId);
				if (songToUpdate) {
					songToUpdate.score += vote.points;
					newSongsWithPoints.add(vote.submissionId);
					newPointsReceived[vote.submissionId] = vote.points;
				}
			});
			setPointsJustReceived((prev) => ({ ...prev, ...newPointsReceived }));
			setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));

			// --- Step 4: Add a delay *between* the 1-7 and the high points ---
			await delay(3000);

			// --- Step 5: Reveal 8, 10, and 12 points with delays in between ---
			for (const vote of highPointVotes) {
				const updatedSongs = [...submissions];
				const songToUpdate = updatedSongs.find((s) => s.submissionId === vote.submissionId);
				setHighPointMessage(`${vote.points} points goes to...`);
				await delay(2000);
				if (songToUpdate) {
					songToUpdate.score += vote.points;
				}
				setHighPointMessage(`${songToUpdate?.songTitle} by ${songToUpdate?.artistName}!`);
				setPointsJustReceived((prev) => ({ ...prev, [vote.submissionId]: vote.points }));
				await delay(1000);
				setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
				await delay(2000);
			}

			// --- Step 6: End of round, wait and move to next voter ---
			await delay(2000);
			setCurrentVoter(null);
			setVotingIndex((prev) => prev + 1);
			setLowPointList([]);
		};

		// ✨ New async function for the televote sequence
		const runTelevoteSequence = async () => {
			if (televotes.length === 0 || !televotes) {
				setHighPointMessage('No televotes found for this edition!');
				setResultsStage('COMPLETE');
				return;
			}
			setReceivedTelevotes([]);
			setLowPointList([]);
			setHighPointMessage('Starting televote sequence...');
			setResultsStage('TELEVOTE');

			// Sort songs from lowest to highest jury score
			const sortedSongsByJuryScore = [...submissions].sort((a, b) => a.score - b.score);

			console.log(sortedSongsByJuryScore);
			console.log(televotes);

			await delay(1000);

			// Loop through each song to reveal its televote points
			for (let i = 0; i < sortedSongsByJuryScore.length; i++) {
				const song = sortedSongsByJuryScore[i];
				const televoteData = televotes.find((vote) => vote.submissionId === song.submissionId);
				const finalReveal = i === sortedSongsByJuryScore.length - 1;

				if (finalReveal && televoteData) {
					setHighPointMessage(undefined);
					// ✨ Corrected Logic: Find the leader from songs NOT including the final song
					const finalSongId = televoteData.submissionId;
					const contenders = submissions.filter((s) => s.submissionId !== finalSongId);
					const leader = [...contenders].sort((a, b) => b.score - a.score)[0];

					setFinalSongToReveal(song);
					setCurrentLeader(leader);
					if (leader.score > song.score) {
						setShowFinalOverlay(true);
					}
					await delay(5500);
					setPointsJustReceived({ [song.submissionId]: televoteData.points });
					const updatedSongs = [...submissions];
					const songToUpdate = updatedSongs.find((s) => s.submissionId === song.submissionId);
					if (songToUpdate) {
						songToUpdate.score += televoteData.points;
					}
					setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
					await delay(2000);
					setReceivedTelevotes((prev) => [...prev, song.submissionId]);
					setPointsJustReceived({});
					setResultsStage('COMPLETE');
					setReceivedTelevotes([]);
					setHighPointMessage(`Congratulations to ${updatedSongs[0].songTitle} by ${updatedSongs[0].artistName}!`);
				}

				if (televoteData && !finalReveal) {
					setHighPointMessage(`${song.songTitle} receives...`);
					await delay(2000);
					setHighPointMessage(`${televoteData.points} points!`);
					await delay(500);
					setPointsJustReceived({ [song.submissionId]: televoteData.points });
					await delay(500);
					const updatedSongs = [...submissions];
					const songToUpdate = updatedSongs.find((s) => s.submissionId === song.submissionId);
					if (songToUpdate) {
						songToUpdate.score += televoteData.points;
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
				const nextVoterId = submissions.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))[votingIndex].userId;
				const voterVotesExist = juryVotes?.some((vote) => vote.fromUserId === (nextVoterId as string));
				if (voterVotesExist) {
					setCurrentVoter(nextVoterId as string);
				}
			} else if (currentVoter === null && votingIndex > -1) {
				const startNextRoundTimer = setTimeout(() => {
					const nextVoterId = edition?.fulfilledSubmissions.sort((a, b) => (a.runningOrder as number) - (b.runningOrder as number))[
						votingIndex
					].userId as string;
					const voterVotesExist = juryVotes?.some((vote) => vote.fromUserId === nextVoterId);
					if (voterVotesExist) {
						setCurrentVoter(nextVoterId);
					} else {
						setErrorMessage(`Failed to find any votes for ${profiles?.find((p) => p.userId === nextVoterId)?.displayName}`);
						delay(2000);
						setCurrentVoter(null);
						setVotingIndex((prev) => prev + 1);
					}
				}, 100);
				return () => clearTimeout(startNextRoundTimer);
			}
		} else {
			setHighPointMessage('Reveal is paused');
		}
	}, [currentVoter, votingIndex, paused]);

	if (isLoading || isProfilesLoading) {
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
					{((points === 12 && resultsStage === 'JURY') ||
						(index === 0 && resultsStage === 'COMPLETE') ||
						(index === 0 && resultsStage === 'TELEVOTE' && receivedTelevotes.includes(song.submissionId))) && (
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

	if (viewBreakdown) {
		return <JuryPivotTable juryVotes={juryVotes} televotes={televotes} submissions={submissions} />;
	}

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
								disabled={votingIndex >= 0}
								className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
							>
								Skip jury sequence
							</Button>
						</>
					)
				)}
				{resultsStage === 'COMPLETE' && <Button onClick={() => setViewBreakdown(true)}>See breakdown of results</Button>}
			</div>
			{paused && (
				<Alert>
					<Info />
					<AlertTitle>Reveal will only pause after the current juror&apos;s votes are revealed.</AlertTitle>
				</Alert>
			)}
			{errorMessage && (
				<Alert>
					<Info />
					<AlertTitle>{errorMessage}</AlertTitle>
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
													src={`https://flagcdn.com/w640/${edition?.fulfilledSubmissions[votingIndex].flag?.toLowerCase()}.png`}
													fill
													alt={`${edition?.fulfilledSubmissions[votingIndex].artistName}'s flag`}
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
							<Progress value={(votingIndex / (edition?.fulfilledSubmissions.length || 0)) * 100} />
							<div className="flex w-full justify-between">
								<div className="text-xs">{`Juror ${votingIndex + 1} of ${edition?.fulfilledSubmissions.length}`}</div>
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
											const song = submissions.find((s) => s.submissionId === vote.submissionId);
											if (!song) return null;
											return (
												<motion.li
													key={vote.voteId}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: index * 0.1 }}
												>
													<Card
														className={`backdrop-blur-sm shadow-xl bg-card text-card-foreground m-0 mb-1 rounded-lg ${song.userId === currentVoter || receivedTelevotes.includes(song.submissionId) ? 'opacity-50 transition-opacity' : ''}`}
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
																{vote.points}
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
						leaderSong={leader as Song}
						stillToScoreSong={finalSongToReveal as Song}
						finalPoints={televotes.find((v) => v.submissionId === finalSongToReveal?.submissionId)?.points as number}
						onAnimationEnd={() => setShowFinalOverlay(false)}
					/>
				)}
			</div>
		</div>
	);
};

export default ResultsComponent;
