import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/card';
import Image from 'next/image';

interface Song {
	submissionId: string;
	songTitle: string;
	artistName: string;
	flag: string;
	score: number;
}

interface FinalOverlayCardProps {
	leaderSong: Song;
	stillToScoreSong: Song;
	finalPoints: number;
	onAnimationEnd: () => void;
}

const FinalOverlayCard: React.FC<FinalOverlayCardProps> = ({ leaderSong, stillToScoreSong, finalPoints }) => {
	const [showPoints, setShowPoints] = useState(false);
	const [displayScore, setDisplayScore] = useState(stillToScoreSong.score);
	const [showCelebration, setShowCelebration] = useState(false);
	const [winner, setWinner] = useState<Song | null>(null);
	const [showPointsNeeded, setShowPointsNeeded] = useState(true);
	const [showPointsReceived, setShowPointsReceived] = useState(false);
	const pointsNeeded = leaderSong.score - stillToScoreSong.score + 1;

	useEffect(() => {
		// Stage 1: Display points needed
		const pointsNeededTimer = setTimeout(() => {
			setShowPointsNeeded(false);

			// Stage 2: Transition to "received..."
			const pointsReceivedTimer = setTimeout(() => {
				setShowPointsReceived(true);
			}, 2500); // T2: 500ms delay after T1 ends

			// Stage 3: Reveal points and start count up
			const pointsRevealTimer = setTimeout(() => {
				setShowPoints(true);
			}, 3000); // T3: 1500ms delay after T1 ends

			// IMPORTANT: Cleanup function for Stages 2 & 3
			return () => {
				clearTimeout(pointsReceivedTimer);
				clearTimeout(pointsRevealTimer);
			};
		}, 2000); // T1: 2000ms initial delay

		// IMPORTANT: Cleanup function for Stage 1
		return () => {
			clearTimeout(pointsNeededTimer);
		};
	}, []);

	useEffect(() => {
		// Only run if the animation is ready to start
		if (showPoints) {
			const finalTotal = stillToScoreSong.score + finalPoints;
			// console.log(finalTotal)
			const start = stillToScoreSong.score;
			const duration = 500; // Example duration
			const startTime = Date.now();
			let animationFrameId: number; // 1. Variable to hold the animation ID

			const animateScore = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				const newScore = start + (finalTotal - start) * progress;

				setDisplayScore(Math.floor(newScore));

				if (progress < 1) {
					// 2. Store the ID when scheduling the next frame
					animationFrameId = requestAnimationFrame(animateScore);
				} else {
					setDisplayScore(finalTotal);

					// (Your win/celebration logic remains here)
					const finalStillToScoreSong = { ...stillToScoreSong, score: finalTotal };
					const finalLeader = { ...leaderSong };
					const finalWinner = finalStillToScoreSong.score > finalLeader.score ? finalStillToScoreSong : finalLeader;

					setTimeout(() => {
						setWinner(finalWinner);
						setShowCelebration(true);
					}, 2000);
				}
			};

			// Start the animation and store the initial ID
			animationFrameId = requestAnimationFrame(animateScore);

			// 3. CLEANUP: This function stops the animation before the effect re-runs or unmounts.
			return () => {
				cancelAnimationFrame(animationFrameId);
			};
		}
		// If showPoints is false, do nothing, no cleanup needed.
		return () => {};
	}, [showPoints, finalPoints, leaderSong]);

	const winningSong = winner || leaderSong;

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 text-white bg-black">
			{/* Dynamic Text Section */}
			<div className="text-4xl md:text-6xl font-extrabold mb-8 drop-shadow-lg text-center h-20">
				<AnimatePresence mode="wait">
					{showPointsNeeded && (
						<motion.h2
							key="points-needed"
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.5 }}
						>
							To win, {stillToScoreSong.artistName} needs {pointsNeeded > 0 ? pointsNeeded : '0'} points
						</motion.h2>
					)}
					{!showPointsNeeded && showPointsReceived && !showCelebration && (
						<motion.h2
							key="points-received"
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.5 }}
						>
							{`${stillToScoreSong.songTitle} received...`}
						</motion.h2>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence>
				{!showCelebration && (
					// The backdrop is now a contained, rounded card
					<motion.div
						key="two-cards-view"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-12 p-8 rounded-2xl bg-black/80 backdrop-blur-sm"
					>
						{/* Card for the current leader */}
						<motion.div
							key="leader-card"
							initial={{ opacity: 0, x: -50 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -100, transition: { duration: 0.5 } }}
							transition={{ delay: 0.5, type: 'spring' }}
							className="w-full flex-1"
						>
							<Card className="bg-white dark:bg-black p-4 h-40 flex flex-col justify-between">
								<h3 className="text-xl font-bold mb-2 text-center">The Current Leader</h3>
								<div className="flex items-center space-x-4">
									<div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-md relative">
										<Image
											src={`https://flagcdn.com/w640/${leaderSong.flag?.toLowerCase()}.png`}
											fill
											alt={`${leaderSong.artistName}'s flag`}
											style={{ objectFit: 'cover', objectPosition: 'center' }}
											quality={80}
											sizes="640px"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-lg font-semibold truncate">{leaderSong.songTitle}</div>
										<div className="text-sm text-muted-foreground truncate">{leaderSong.artistName}</div>
									</div>
									<div className="flex-shrink-0 text-xl font-bold">{leaderSong.score}</div>
								</div>
							</Card>
						</motion.div>

						{/* Card for the song still to score */}
						<motion.div
							key="still-to-score-card"
							initial={{ opacity: 0, x: 50 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 100, transition: { duration: 0.5 } }}
							transition={{ delay: 0.5, type: 'spring' }}
							className="relative w-full flex-1"
						>
							<Card className="bg-white dark:bg-black p-4 h-40 flex flex-col justify-between">
								<h3 className="text-xl font-bold mb-2 text-center">Still to Score</h3>
								<div className="flex items-center space-x-4">
									<div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-md relative">
										<Image
											src={`https://flagcdn.com/w640/${stillToScoreSong.flag?.toLowerCase()}.png`}
											fill
											alt={`${stillToScoreSong.artistName}'s flag`}
											style={{ objectFit: 'cover', objectPosition: 'center' }}
											quality={80}
											sizes="640px"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-lg font-semibold truncate">{stillToScoreSong.songTitle}</div>
										<div className="text-sm text-muted-foreground truncate">{stillToScoreSong.artistName}</div>
									</div>
									<div className="flex-shrink-0 text-xl font-bold">{displayScore}</div>
								</div>
							</Card>
							{/* Point Reveal Animation */}
							<AnimatePresence>
								{showPoints && (
									<motion.div
										key="final-points"
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.5 }}
										transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 1 }}
										className="absolute top-1/2 right-0 md:-right-1/4 transform -translate-y-1/2 -translate-x-1/2 bg-blue-500 rounded-md w-15 h-15 flex items-center justify-center text-xl font-extrabold shadow-lg"
									>
										{finalPoints}
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showCelebration && (
					<motion.div
						key="final-winner-card"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ type: 'spring', stiffness: 100, damping: 10 }}
						className="w-full flex flex-col items-center max-w-lg mx-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
					>
						<Card className="bg-white dark:bg-black p-8 rounded-xl shadow-2xl w-full">
							<div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 shadow-lg relative">
								<Image
									src={`https://flagcdn.com/w640/${winningSong.flag?.toLowerCase()}.png`}
									fill
									alt={`${winningSong.artistName}'s flag`}
									style={{ objectFit: 'cover', objectPosition: 'center' }}
									quality={80}
									sizes="640px"
								/>
							</div>
							<h3 className="text-2xl md:text-3xl font-bold drop-shadow-lg text-center">{winningSong.songTitle}</h3>
							<p className="text-xl text-muted-foreground text-center">{`by ${winningSong.artistName}`}</p>
							<h2 className="text-5xl md:text-3xl font-bold drop-shadow-lg text-center">is the winner</h2>
							<div className="text-5xl font-extrabold mt-2 drop-shadow-lg text-center">{`with ${winningSong.score} points`}</div>
						</Card>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default FinalOverlayCard;
