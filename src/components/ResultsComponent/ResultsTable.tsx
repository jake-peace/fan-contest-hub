import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Card } from "../ui/card";

// New Interface for your raw data
interface RawVote {
    voteId: string;       // The unique key for the cell (what you want)
    submissionId: string; // The receiving country/song (used for rows)
    points: number;
    fromUserId: string;   // The jury country/user (used for columns)
}

// Updated structure for the breakdown data
interface PivotCellData {
    points: number;
    voteId: string;
}

// Updated structure for the complete final data structure
interface PivotRow {
    country: string; // The receiving country
    total: number;
    televotes: number;
    // pointsByJury now stores an object containing both points and the voteId
    pointsByJury: PivotCellData[]; 
}

// Interface for the complete final data structure
interface PivotTableData {
  headers: string[]; // ['Country', ...JuryCountries, 'Total']
  rows: PivotRow[];
}

/**
 * Generates a pivot table structure from raw jury votes, storing the voteId for each cell.
 *
 * @param rawVotes - Array of all individual jury votes.
 * @param allJuryUsers - Array of all submitting user IDs (jury columns).
 * @param allSubmissionIds - Array of all receiving song/submission IDs (table rows).
 * @returns The final structured data ready for rendering.
 */
const generateJuryPivotTable = (
  rawVotes: RawVote[],
  televotes: { submissionId: string, points: number }[],
  allJuryUsers: string[], // Use fromUserId for columns
  allSubmissionIds: string[] // Use submissionId for rows
): PivotTableData => {
  
  type AggregationData = {
    total: number;
    // Breakdown now maps the jury ID to the cell data object
    breakdown: { [key: string]: PivotCellData }; 
  };

  const pivotMap = new Map<string, AggregationData>();

  // Initialize all submissions
  allSubmissionIds.forEach(id => {
    pivotMap.set(id, {
      total: 0,
      breakdown: {}
    });
  });

  // 1. Process Raw Votes: Store voteId and points
  rawVotes.forEach(vote => {
    const receiverData = pivotMap.get(vote.submissionId);

    if (receiverData) {
      // Update total score
      receiverData.total += vote.points;

      // Store the points and the voteId from the specific jury user
      receiverData.breakdown[vote.fromUserId] = { 
        points: vote.points, 
        voteId: vote.voteId 
      };

      pivotMap.set(vote.submissionId, receiverData);
    }
  });

  // 2. Convert Map to Final Array Structure and Sort
  const sortedRows: PivotRow[] = Array.from(pivotMap.entries())
    .map(([submissionId, data]) => {
      
      // Create an array of PivotCellData objects corresponding to the header order
      const rowData = allJuryUsers.map(juryId => {
        // Find the cell data, or provide a default for 0 points
        return data.breakdown[juryId] || { 
          points: 0, 
          // Assign a unique placeholder key for un-voted cells 
          voteId: `${submissionId}-${juryId}-0` 
        };
      });

      return {
        country: submissionId, // Use submissionId as the country/song identifier for the row
        total: data.total + (televotes.find(t => t.submissionId == submissionId)?.points || 0),
        televotes: televotes.find(t => t.submissionId == submissionId)?.points || 0,
        pointsByJury: rowData,
      };
    })
    // Sort by total score, highest to lowest
    .sort((a, b) => b.total - a.total);

    console.log(sortedRows);

  // 3. Construct the Final Pivot Table Object
  return {
    headers: ['Song', ...allJuryUsers, 'Televotes', 'Total'],
    rows: sortedRows,
  };
};

// Re-use the interface defined above
interface PivotTableData {
    headers: string[];
    rows: PivotRow[];
}

interface JuryPivotTableProps {
    juryVotes: {
    voteId: string;
    submissionId: any;
    points: number;
    fromUserId: string;
}[];
    televotes: {
        submissionId: string;
        points: number;
    }[];
    submissions: Song[];
}

interface Song { 
    submissionId: string;
    songTitle: string;
    artistName: string;
    userId: string;
    score: number;
    flag: string; 
}

interface AggregatedRow {
    submissionId: string;
    title: string;
    artist: string;
    totalPoints: number;
    // Array of votes received by this song
    votesReceived: {
        points: number;
        fromUserId: string; // The jury name/ID
    }[];
}

// Assuming your PivotTableData interface is available

interface JuryResultsMobileCardsProps {
    data: PivotTableData;
}

const JuryResultsMobileCards: React.FC<JuryPivotTableProps> = ({ juryVotes, televotes, submissions }) => {

    // Helper function to process raw votes into renderable card data
    const aggregateVotes = (votes: JuryPivotTableProps['juryVotes'], songs: Song[]): AggregatedRow[] => {
        const submissionMap = new Map<string, AggregatedRow>();

        // 1. Initialize map with submission details
        songs.forEach(song => {
            submissionMap.set(song.submissionId, {
                submissionId: song.submissionId,
                title: song.songTitle,
                artist: song.artistName,
                totalPoints: 0,
                votesReceived: []
            });
        });

        // 2. Aggregate votes
        votes.forEach(vote => {
            const row = submissionMap.get(vote.submissionId);
            if (row) {
                row.totalPoints += vote.points;
                row.votesReceived.push({
                    points: vote.points,
                    fromUserId: vote.fromUserId
                });
            }
        });

        // 3. Convert map to array and sort by total points
        return Array.from(submissionMap.values())
            .sort((a, b) => b.totalPoints - a.totalPoints);
    };

    // Use useMemo to ensure aggregation only runs when inputs change
    const aggregatedResults = useMemo(() => aggregateVotes(juryVotes, submissions), [juryVotes, submissions]);

    return (
        <div className="space-y-4 p-2">
            {aggregatedResults.map((row) => {
                
                // Get the top votes (e.g., 8 points or higher)
                const topVotes = row.votesReceived
                    .filter(v => v.points >= 8) 
                    .sort((a, b) => b.points - a.points);
                
                return (
                    <div 
                        key={row.submissionId} 
                        className="p-4 rounded-lg shadow-md border dark:border-gray-700 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <div className="flex justify-between items-center border-b pb-2 mb-2 dark:border-gray-700">
                            {/* Song Title and Artist */}
                            <h4 className="text-sm font-bold truncate">
                                {row.title} <span className="text-xs font-normal opacity-75">by {row.artist}</span>
                            </h4>
                            
                            {/* Total Score */}
                            <div className="text-xl font-extrabold px-3 py-1 rounded-full bg-indigo-600 text-white ml-2">
                                {row.totalPoints}
                            </div>
                        </div>
                        
                        {/* Breakdown Section */}
                        <p className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Top Jury Votes:</p>
                        <div className="flex flex-wrap gap-2">
                            {topVotes.map((vote, index) => (
                                <span 
                                    key={`${row.submissionId}-${vote.fromUserId}`} // Unique key for the vote display
                                    className={`text-xs font-bold px-2 py-1 rounded-full 
                                                ${vote.points === 12 ? 'bg-yellow-400 text-gray-900' : 'bg-green-400 text-gray-900'}`}
                                >
                                    {vote.points} from {vote.fromUserId}
                                </span>
                            ))}
                            {topVotes.length === 0 && (
                                <span className="text-xs italic text-gray-500">No top points received.</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const JuryPivotTable: React.FC<JuryPivotTableProps> = ({ juryVotes, televotes, submissions }) => {

    const data = generateJuryPivotTable(juryVotes, televotes, submissions.map(s => s.userId), submissions.map(s => s.submissionId));

    const getCellColour = (points: number) => {
		switch (points) {
			case 12:
				return 'bg-(--gold) text-[black]';
			case 10:
				return 'bg-(--silver) text-[black]';
			case 8:
				return 'bg-(--bronze) text-[black]';
			default:
				return '';
		}
	};

    const tableRef = useRef<HTMLDivElement>(null);

    return (
        <div 
            id="jury-pivot-table"
            className="p-2 shadow-xl rounded-lg max-w-full"
        >
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {data.headers.map((head) => (
                                <TableHead key={head} className={`px-[0.25vw] py-[0.25vw] lg:px-3 lg:py-3 text-[1.5vw] lg:text-sm font-medium uppercase tracking-wider text-center`}>{head}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.rows.map((row) => (
                            <TableRow key={row.country}>
                                <TableCell className={`px-[1vw] py-[0.2vw] whitespace-nowrap text-[1.5vw] lg:text-sm font-medium text-right`}>
                                    {row.country}
                                </TableCell>
                                {row.pointsByJury.map((point) => (
                                    point.points === 0 ? (
                                        <TableCell key={`${point.voteId}`} className="whitespace-nowrap text-[1.5vw] lg:text-sm text-center font-semibold"></TableCell>
                                    ) : (
                                        <TableCell key={`${point.voteId}`} className={`whitespace-nowrap text-[1.5vw] text-center font-semibold `}>
                                            <div className={`rounded-md font-semibold text-[2vw] m:text-xl ${getCellColour(point.points)} m-[0.125vw]`}>{point.points}</div></TableCell>
                                    )
                                ))}
                                <TableCell className={`whitespace-nowrap text-[1.5vw] lg:text-sm font-bold text-center`}>
                                    {row.televotes}
                                </TableCell>
                                <TableCell className={`whitespace-nowrap text-[1.5vw] lg:text-sm font-bold text-center`}>
                                    {row.total}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </Card>
            </div> 
    );
};

export default JuryPivotTable;