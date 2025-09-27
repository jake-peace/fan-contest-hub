import { Music, Trophy, Vote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useQuery } from '@tanstack/react-query';
import { useAmplifyClient } from '@/app/amplifyConfig';
import { toast } from 'sonner';
import { Schema } from '../../../amplify/data/resource';
import { Spinner } from '../ui/spinner';
import { Button } from '../ui/button';
import { AnimatePresence, motion } from 'motion/react';
import { getUnixTime } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { Progress } from '../ui/progress';
import FinalOverlayCard from './FinalCard';
import { v3 } from 'uuid';
import JuryPivotTable from './ResultsTable';

type Vote = Schema['Vote']['type'];
type Edition = Schema['Edition']['type'];
type Submission = Schema['Submission']['type'];

interface ResultsComponentProps {
	edition: Edition;
	submissions: Submission[];
}

// Mock data for the songs and the votes
const mockSubmissions = [
	{ submissionId: '1', songTitle: 'Voyage', artistName: 'ABBA', userId: '1', score: 0, flag: 'se' },
  { submissionId: '2', songTitle: 'Zitti E Buoni', artistName: 'Måneskin', userId: '2', score: 0, flag: 'it' },
  { submissionId: '3', songTitle: 'Euphoria', artistName: 'Loreen', userId: '3', score: 0, flag: 'se' },
  { submissionId: '4', songTitle: 'Arcade', artistName: 'Duncan Laurence', userId: '4', score: 0, flag: 'nl' },
  { submissionId: '5', songTitle: 'Fairytale', artistName: 'Alexander Rybak', userId: '5', score: 0, flag: 'no' },
  { submissionId: '6', songTitle: 'Hard Rock HallelujahHard Rock HallelujahHard Rock Hallelujah', artistName: 'Lordi', userId: '6', score: 0, flag: 'fi' },
  { submissionId: '7', songTitle: 'Soldi', artistName: 'Mahmood', userId: '7', score: 0, flag: 'it' },
  { submissionId: '8', songTitle: 'Rise Like a Phoenix', artistName: 'Conchita Wurst', userId: '8', score: 0, flag: 'at' },
  { submissionId: '9', songTitle: 'Toy', artistName: 'Netta', userId: '9', score: 0, flag: 'il' },
  { submissionId: '10', songTitle: 'Heroes', artistName: 'Måns Zelmerlöw', userId: '10', score: 0, flag: 'se' },
  { submissionId: '11', songTitle: 'Satellite', artistName: 'Lena', userId: '11', score: 0, flag: 'de' },
  { submissionId: '12', songTitle: 'A Million Voices', artistName: 'Polina Gagarina', userId: '12', score: 0, flag: 'ru' },
  { submissionId: '13', songTitle: 'Only Teardrops', artistName: 'Emmelie de Forest', userId: '13', score: 0, flag: 'dk' },
  { submissionId: '14', songTitle: 'Amar pelos dois', artistName: 'Salvador Sobral', userId: '14', score: 0, flag: 'pt' },
  { submissionId: '15', songTitle: 'Fuego', artistName: 'Eleni Foureira', userId: '15', score: 0, flag: 'cy' },
  { submissionId: '16', songTitle: 'My Number One', artistName: 'Helena Paparizou', userId: '16', score: 0, flag: 'gr' },
  { submissionId: '17', songTitle: 'La la Love', artistName: 'Ivi Adamou', userId: '17', score: 0, flag: 'cy' },
  { submissionId: '18', songTitle: 'Qele Qele', artistName: 'Sirusho', userId: '18', score: 0, flag: 'am' },
  { submissionId: '19', songTitle: 'Running Scared', artistName: 'Ell & Nikki', userId: '19', score: 0, flag: 'az' },
  { submissionId: '20', songTitle: 'Lane Moje', artistName: 'Željko Joksimović', userId: '20', score: 0, flag: 'rs' },
];

// This represents the points given by each "user"

/**
 * Fisher-Yates shuffle algorithm.
 * Shuffles an array in place.
 */
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Generates mock voting data, ensuring a user cannot vote for their own song.
 *
 * @param totalUsers The total number of users.
 * @param songs The full list of song objects.
 * @returns A list of mock vote objects.
 */
function generateMockVotes(totalUsers: number, songs: any[]) {
  const allVotes = [];
  let voteId = 1;
  const pointsGiven = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

  for (let userId = 1; userId <= totalUsers; userId++) {
    // 1. Find the submission ID for the current user's own song.
    const userOwnSong = songs.find(song => song.userId === userId.toString());
    
    if (!userOwnSong) {
      console.warn(`User with ID ${userId} has no song and cannot vote.`);
      continue;
    }

    // 2. Create a list of all song IDs that are NOT the user's own.
    const votableSongIds = songs
      .filter(song => song.submissionId !== userOwnSong.submissionId)
      .map(song => song.submissionId);

    // 3. Create a copy of the votable songs before shuffling it!
    const songsToShuffle = votableSongIds.slice();

    // 4. Shuffle the copy of the list.
    shuffleArray(songsToShuffle);

    // 5. Take the first 10 unique songs from the shuffled array.
    const uniqueVotedSongs = songsToShuffle.slice(0, pointsGiven.length);

    // 6. Assign points to the unique songs.
    for (let i = 0; i < pointsGiven.length; i++) {
      allVotes.push({
        voteId: voteId.toString(),
        submissionId: uniqueVotedSongs[i],
        points: pointsGiven[i],
        fromUserId: userId.toString(),
      });
      voteId++;
    }
  }
  return allVotes;
}

function generateMockTele() {
    let mockTele = [];
    for (let i = 0; i < 21; i++) {
        mockTele.push({
            submissionId: i.toString(),
            points: Math.floor(Math.random() * (120 - 0 + 1) + 0),
        })
    }
    return mockTele;
}

const mockTele = generateMockTele();

const mockVotes = generateMockVotes(20, mockSubmissions);

interface Song
    { submissionId: string; songTitle: string; artistName: string; userId: string; score: number; flag: string; }

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const ResultsComponent: React.FC<ResultsComponentProps> = ({ edition }) => {
	const client = useAmplifyClient();

	const votingOrder = useRef(() => {
		return mockSubmissions;
	});
	const [submissions, setSubmissions] = useState(mockSubmissions);
	const [votingIndex, setVotingIndex] = useState(-1);
	const [pointsJustReceived, setPointsJustReceived] = useState<Record<string, number>>({});
	const [currentVoter, setCurrentVoter] = useState<string | null>(null);
    const [lowPointList, setLowPointList] = useState<{
    voteId: string;
    submissionId: any;
    points: number;
    fromUserId: string;
}[]>([])
    const [highPointMessage, setHighPointMessage] = useState<string | undefined>();
    const [isMobile, setIsMobile] = useState(false);
    const [resultsStage, setResultsStage] = useState<'JURY' | 'TELEVOTE' | "COMPLETE">('JURY')
    const [receivedTelevotes, setReceivedTelevotes] = useState<string[]>([]);
    const [showFinalOverlay, setShowFinalOverlay] = useState<boolean>(false);
    const [finalSongToReveal, setFinalSongToReveal] = useState<Song>();
    const [leader, setCurrentLeader] = useState<Song>();
    const [viewBreakdown, setViewBreakdown] = useState(false);

    const allPoints = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

	// Add a constant for the column limit
	const MAX_SONGS_PER_COLUMN = 15;
    const SONG_CARD_HEIGHT = 35;

	const { data: allVotes, isLoading } = useQuery({
		queryKey: ['resultsQuery'],
		queryFn: async () => {
			const { data: votes } = await client.models.Vote.list({
				filter: {
					or: submissions.map((submission) => {
						return { submissionId: { eq: submission.submissionId } };
					}),
				},
			});
			console.log(votes);
			if (!votes) {
				toast.error('Votes not found');
			}
			return votes as unknown as Vote[];
		},
	});

    const handleSkipJury = () => {
        mockVotes.forEach((v) => {
            const updatedSongs = [...submissions];
            const songToUpdate = submissions.find(s => s.submissionId === v.submissionId);
            if (songToUpdate) {
                songToUpdate.score += v.points;
            }
            setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
        })
        setResultsStage('TELEVOTE');
        setVotingIndex(20);
        setCurrentVoter('a');
    }

    useEffect(() => {
        // ✨ Handle initial and ongoing screen size checks
        const handleResize = () => {
        setIsMobile(window.innerWidth < 768); // Tailwind's `md` breakpoint
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return () => window.removeEventListener('resize', handleResize);
    }, []);

	// const votingOrder = allVotes?.sort((a, b) => getUnixTime(new Date(a.createdAt)) - getUnixTime(new Date(b.createdAt))).map((vote) => vote.fromUserId) as string[];

    useEffect(() => {
        // This function will run when a new voter appears
        const runRevealSequence = async () => {
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
            
            const voterVotes = mockVotes.filter(vote => vote.fromUserId === currentVoter);
            const sortedVotes = [...voterVotes].sort((a, b) => a.points - b.points);
            const lowPointVotes = sortedVotes.filter(vote => vote.points < 8);
            const highPointVotes = sortedVotes.filter(vote => vote.points >= 8).sort((a, b) => a.points - b.points);
            
            // --- Step 1: Voter card and 1-7 list appear immediately ---
            await delay(1000);
            setLowPointList(lowPointVotes.sort((a, b) => b.points - a.points));

            // --- Step 2: Delay for 1 second ---
            await delay(2000);

            // --- Step 3: Apply 1-7 points to the scoreboard ---
            const updatedSongs = [...submissions];
            const newSongsWithPoints = new Set<string>();
            const newPointsReceived: Record<string, number> = {};
            lowPointVotes.forEach(vote => {
                const songToUpdate = updatedSongs.find(s => s.submissionId === vote.submissionId);
                if (songToUpdate) {
                    songToUpdate.score += vote.points;
                    newSongsWithPoints.add(vote.submissionId);
                    newPointsReceived[vote.submissionId] = vote.points;
                }
            });
            setPointsJustReceived(prev => ({ ...prev, ...newPointsReceived }));
            setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));

            // --- Step 4: Add a delay *between* the 1-7 and the high points ---
            await delay(3000);

            // --- Step 5: Reveal 8, 10, and 12 points with delays in between ---
            for (const vote of highPointVotes) {
                const updatedSongs = [...submissions];
                const songToUpdate = updatedSongs.find(s => s.submissionId === vote.submissionId);
                setHighPointMessage(`${vote.points} points goes to...`)
                await delay(2000);
                if (songToUpdate) {
                    songToUpdate.score += vote.points;
                }
                setHighPointMessage(`${songToUpdate?.songTitle} by ${songToUpdate?.artistName}!`);
                setPointsJustReceived(prev => ({ ...prev, [vote.submissionId]: vote.points }));
                await delay(1000);
                setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
                await delay(2000);
            }

            // --- Step 6: End of round, wait and move to next voter ---
            await delay(2000);
            setCurrentVoter(null);
            setVotingIndex(prev => prev + 1);
            setLowPointList([]);
        };

        // ✨ New async function for the televote sequence
        const runTelevoteSequence = async () => {
            setReceivedTelevotes([]);
            setLowPointList([]);
            setHighPointMessage('Starting televote sequence...');
            setResultsStage('TELEVOTE');
            
            // Sort songs from lowest to highest jury score
            const sortedSongsByJuryScore = [...submissions].sort((a, b) => a.score - b.score);

            await delay(1000);
            
            // Loop through each song to reveal its televote points
            for (let i = 0; i < sortedSongsByJuryScore.length; i++) {
                const song = sortedSongsByJuryScore[i];
                const televoteData = mockTele.find(vote => vote.submissionId === song.submissionId);
                const finalReveal = i === sortedSongsByJuryScore.length - 1;

                if (finalReveal && televoteData) {
                    setHighPointMessage(undefined);
                    // ✨ Corrected Logic: Find the leader from songs NOT including the final song
                    const finalSongId = televoteData.submissionId;
                    const contenders = submissions.filter(s => s.submissionId !== finalSongId);
                    const leader = [...contenders].sort((a, b) => b.score - a.score)[0];

                    setFinalSongToReveal(song);
                    setCurrentLeader(leader);
                    if (leader.score > song.score) {
                        setShowFinalOverlay(true);
                    }
                    await delay(5500);
                    setPointsJustReceived({ [song.submissionId]: televoteData.points });
                    const updatedSongs = [...submissions];
                    const songToUpdate = updatedSongs.find(s => s.submissionId === song.submissionId);
                    if (songToUpdate) {
                        songToUpdate.score += televoteData.points;
                    }
                    setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
                    await delay(2000);
                    setReceivedTelevotes(prev => [...prev, song.submissionId])
                    setPointsJustReceived({});
                    setResultsStage('COMPLETE');
                    setReceivedTelevotes([]);
                    setHighPointMessage(`Congratulations to ${updatedSongs[0].songTitle} by ${updatedSongs[0].artistName}!`)
                }

                // todo: on last song to receive televote points, do a side by side comparison
                // then ungrey all songs to show final leaderboard
                
                if (televoteData && !finalReveal) {
                    setHighPointMessage(`${song.songTitle} receives...`)
                    await delay(20);
                    setHighPointMessage(`${televoteData.points} points!`)
                    await delay(5);
                    setPointsJustReceived({ [song.submissionId]: televoteData.points });
                    await delay(5);
                    const updatedSongs = [...submissions];
                    const songToUpdate = updatedSongs.find(s => s.submissionId === song.submissionId);
                    if (songToUpdate) {
                        songToUpdate.score += televoteData.points;
                    }
                    setSubmissions(updatedSongs.sort((a, b) => b.score - a.score));
                    // todo: grey out a song if it's received televote points
                    await delay(20);
                    setReceivedTelevotes(prev => [...prev, song.submissionId])
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
        if (votingIndex === -1) {
            const nextVoterId = (votingIndex + 1).toString();
            const voterVotesExist = mockVotes.some(vote => vote.fromUserId === nextVoterId);
            if (voterVotesExist) {
                setCurrentVoter(nextVoterId);
            }
        } else if (currentVoter === null && votingIndex > -1) {
            const startNextRoundTimer = setTimeout(() => {
                const nextVoterId = (votingIndex + 1).toString();
                const voterVotesExist = mockVotes.some(vote => vote.fromUserId === nextVoterId);
                if (voterVotesExist) {
                    setCurrentVoter(nextVoterId);
                } else {
                    console.log("All votes revealed.");
                }
        }, 100);
        return () => clearTimeout(startNextRoundTimer);
        }
    }, [currentVoter, votingIndex]);

	if (isLoading) {
		return <Spinner />;
	}

    const renderSongCard = (song: Song, index: number) => {
        const points = pointsJustReceived[song.submissionId];

        // dynamic position calculation

        // ✨ Dynamic positioning logic based on isMobile state
        const isRightColumn = !isMobile && index >= MAX_SONGS_PER_COLUMN;
        const topOffset = isMobile 
            ? index * SONG_CARD_HEIGHT 
            : (isRightColumn ? index - MAX_SONGS_PER_COLUMN : index) * SONG_CARD_HEIGHT;
        const leftOffset = isMobile 
            ? 0 
            : (isRightColumn ? 50 : 0);
        const cardWidth = isMobile ? '100%' : '50%';
        const cardPadding = isMobile ? 'p-2' : 'p-2';

        return (
            <motion.li
                key={song.submissionId}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 150, damping: 30, mass: 1 }}
                className={`absolute w-full md:w-1/2`} // ✨ Corrected: w-full on mobile, w-1/2 on desktop
                style={{ top: topOffset, left: `${leftOffset}%`, width: cardWidth }}
            >
                <Card
                    className={`backdrop-blur-sm m-0 mx-0.5 rounded-lg shadow-xl bg-card text-card-foreground ${song.userId === currentVoter || receivedTelevotes.includes(song.submissionId) ? 'opacity-50 transition-opacity' : ''}`}
                >
                    <CardContent className="flex items-center p-0">
                        {/* Flag on the left */}
                        <div className="w-5 h-5 rounded-sm overflow-hidden mr-4 ml-1.5 shadow-md">
                            <img
                                src={`https://flagcdn.com/w80/${song.flag}.png`}
                                alt={`${song.artistName}'s flag`}
                                className="w-full h-full object-cover"
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
                                        className={`text-lg text-white p-2 rounded-md min-w text-center flex items-center justify-center ${(points === 12 && resultsStage === 'JURY') ? 'bg-[#9c27b0]' : 'bg-[#2196f3]'}`}
                                        style={{ width: 40, height: 30, fontWeight: 'bold' }}
                                    >
                                        {points}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="text-lg font-bold text-center flex items-center justify-center" style={{ width: 30, height: 30 }}>{song.score}</div>
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
                            // onAnimationComplete={() => setFlashSongId(null)}
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
    }

    if (viewBreakdown) {
        return <JuryPivotTable juryVotes={mockVotes} televotes={mockTele} submissions={submissions} />
    }

	return (
		<div className="p-1 max-w-6xl mx-auto flex flex-col md:space-x-8">
            <Button
					onClick={() => setVotingIndex(0)}
					disabled={votingIndex >= 0}
					className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
				>
					Start Reveal
				</Button>

                <Button
					onClick={handleSkipJury}
					disabled={votingIndex >= 0}
					className="px-4 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
				>
					Skip jury sequence
				</Button>

			{/* Main content area: Voter Card + Scoreboard Columns */}
            <div className="flex w-full mt-2 space-x-2 flex-col md:flex-row w-full mt-8 md:space-x-4">
                {/* Fixed Voter Card Container */}
                <div className="w-full min-w-[200px] md:w-1/4 flex-shrink-0 relative">
                    {resultsStage === 'JURY' && <Card className="px-8 py-8 mb-2 rounded-xl shadow-xl bg-card text-card-foreground text-center justify-center">
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
                                
                                <div className='flex w-full justify-between'>
                                    <div className="w-8 h-8 rounded-md overflow-hidden shadow-md">
                                        <img
                                            src={`https://flagcdn.com/w80/${mockSubmissions[votingIndex].flag}.png`}
                                            alt={`sweden's flag`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <h2 className="text-2xl text-primary font-bold">{`${currentVoter}`}</h2>
                                    {/* <div className='text-xs'>{mockSubmissions[votingIndex].artistName}</div> */}
                                </div>
                                {/* <div className='text-xs truncate mt-2'>{`Sent ${mockSubmissions[votingIndex].songTitle} by ${mockSubmissions[votingIndex].artistName}`}</div> */}
                                {/* <h3 className="text-2xl font-semibold text-primary">{currentVoter}</h3> */}
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
                        <div className='flex w-full justify-between max-w-full'>
                            <AnimatePresence>
                            {currentVoter && allPoints.map((p, index) => {
                                // Determine if the square should be the solid/filled version
                                const isSolid = !Object.values(pointsJustReceived).includes(p);
                                
                                // Define dynamic colors based on the value of 'p'
                                const solidBg = (p === 12) ? 'rgba(156, 39, 176, 1)' : 'rgba(33, 149, 243, 1)';
                                const borderColorRgb = (p === 12) ? 'rgb(156, 39, 176)' : 'rgb(33, 150, 243)';

                                return (
                                    <div key={index} className='flex w-full justify-between'>
                                        <motion.div
                                            // 🚨 CRITICAL: Use index as the key. We are NOT conditionally rendering.
                                            key={index} 
                                            
                                            // Use a single 'animate' prop to handle both the entry and the state change
                                            animate={{ 
                                                // 1. Movement and Opacity (Entry/Exit style)
                                                opacity: 1, // Always visible
                                                y: 0,       // Resting position
                                                
                                                // 2. Color and Border (The Transition)
                                                backgroundColor: isSolid ? solidBg : 'rgba(0, 0, 250, 0)',
                                                borderColor: borderColorRgb,
                                                borderWidth: isSolid ? 0 : 1,
                                            }}
                                            
                                            // Define the entry animation (Starts from invisible/above)
                                            initial={{ opacity: 0, y: -20, backgroundColor: solidBg, borderWidth: 0 }}
                                            
                                            // Since the element stays in the DOM, we don't need 'exit' 
                                            // The state change is handled by the dynamic 'animate' values
                                            
                                            transition={{ 
                                                duration: 1,
                                                // Apply spring to y/opacity, and smooth timing to colors/border
                                                y: { type: 'spring', stiffness: 400, damping: 30 },
                                                opacity: { type: 'spring', stiffness: 400, damping: 30 },
                                                backgroundColor: { duration: 0.5 },
                                                borderColor: { duration: 0.5 },
                                                borderWidth: { duration: 0.5 }
                                            }}

                                            exit={{ opacity: 0 }}
                                            
                                            style={{ 
                                                width: 20, 
                                                height: 20,
                                                fontWeight: 'bold',
                                                // Initialize static border style
                                                borderStyle: 'solid', 
                                            }}
                                            className={`text-sm m-0.25 text-primary p-2 rounded-sm min-w text-center flex items-center justify-center`}
                                        >
                                            {p}
                                        </motion.div>
                                    </div>
                                )})}
                            </AnimatePresence>
                        </div>
                        <Progress value={(votingIndex / mockSubmissions.length) * 100}/>
                        <div className='flex w-full justify-between'>
                            <div className='text-xs'>{`Juror ${votingIndex + 1} of ${mockSubmissions.length}`}</div>
                        </div>
                    </Card>}

                    {/* ✨ New List Component for 1-7 Points */}
                    <AnimatePresence>
                        {(lowPointList.length > 0 || highPointMessage) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            {highPointMessage ? (<motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                            >
                                <Card className='py-4 shadow-xl bg-card text-card-foreground'>
                                    <CardContent>
                                        <motion.ul className="list-none p-0">
                                            <motion.li
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="flex justify-between items-center my-1 text-sm font-medium"
                                            >
                                                <span className="font-bold text-lg text-primary">{highPointMessage}</span>
                                            </motion.li>
                                        </motion.ul>
                                    </CardContent>
                                </Card>
                                <Button onClick={() => setViewBreakdown(true)} className='mt-2 w-full'>
                                    See breakdown of results
                                </Button>
                            </motion.div>
                        ) : (
                                    <motion.ul className="list-none p-0">
                                        {lowPointList.map((vote, index) => {
                                            const song = submissions.find(s => s.submissionId === vote.submissionId);
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
                                                        <div className="w-5 h-5 rounded-lg overflow-hidden mr-4 ml-2 shadow-md">
                                                            <img
                                                                src={`https://flagcdn.com/w80/${song.flag}.png`}
                                                                alt={`${song.artistName}'s flag`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        {/* Song Title and Artist */}
                                                        <div className="flex-1 flex gap-2 min-w-0">
                                                            <div className="text-sm font-semibold truncate">{song.songTitle}</div>
                                                            <div className="text-sm text-muted-foreground truncate pr-1">{song.artistName}</div>
                                                        </div>
                                                        <span className="font-bold text-lg text-primary text-lg text-white rounded-md text-center flex items-center justify-center bg-[#2196f3]" style={{ minWidth: 30, height: 30 }}>{vote.points}</span>
                                                    </CardContent>
                                                </Card>
                                            </motion.li>
                                            );
                                        })}
                                    </motion.ul>
                                )}
                        </motion.div>
                        )}
                        {/* {highPointMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                            >
                                <Card className='mt-4 py-4'>
                                    <CardContent>
                                        <motion.ul className="list-none p-0">
                                                <motion.li
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    className="flex justify-between items-center my-1 text-sm font-medium"
                                                >
                                                    <span className="font-bold text-lg text-primary">{highPointMessage}</span>
                                                </motion.li>
                                        </motion.ul>
                                    </CardContent>
                                </Card>
                                
                            </motion.div>
                        )} */}
                    </AnimatePresence>
                </div>

                {/* The single scoreboard container */}
                <div className="relative w-full md:w-3/4 mt-8 md:mt-0">
                    <motion.ul layout className="relative w-full list-none p-0" style={{ height: isMobile 
                ? `${submissions.length * SONG_CARD_HEIGHT}px` 
                : `${Math.ceil(submissions.length / 2) * SONG_CARD_HEIGHT}px` }}>
                        {submissions.map(renderSongCard)}
                    </motion.ul>
                </div>

                {/* ✨ The Final Reveal Overlay Component */}
                {showFinalOverlay && (
                    <FinalOverlayCard
                        leaderSong={leader as Song}
                        stillToScoreSong={finalSongToReveal as Song}
                        finalPoints={mockTele.find(v => v.submissionId === finalSongToReveal?.submissionId)?.points as number}
                        onAnimationEnd={() => setShowFinalOverlay(false)}
                    />
                )}
            </div>
		</div>
	);
};

export default ResultsComponent;
