// export interface Contest {
//     id: string;
//     title: string;
//     description: string;
//     deadline: Date;
//     // maxParticipants: number; is this needed?
//     phase: ContestPhase;
//     participants: Participant[];
//     submissions: Submission[];
//     code: string;
//     owner: string;
// }

import { EditionPhase } from '@/mockData/newMockData';

// export interface Participant {
//     id: string;
//     name: string;
//     hasSubmitted: boolean;
//     hasVoted?: boolean;
// }

// interface Submission {
//     id: string;
//     participantId: string;
//     title: string;
//     artist: string;
//     country: string;
//     flagEmoji: string;
//     spotifyId?: string;
//     spotifyUrl?: string;
//     albumArt?: string;
//     points?: number;
// }

// export type ContestPhase = 'SUBMISSION' | 'VOTING' | 'RESULTS';

// Interfaces for the contest application data structures.

/**
 * Represents a single participant in a contest.
 */
export interface Participant {
	id: string;
	hasSubmitted: boolean;
	hasVoted: boolean;
}

/**
 * Represents a single submission within an edition.
 */
export interface Submission {
	id: string;
	participantId: string;
	title: string;
	artist: string;
	country: string;
	flagEmoji: string;
	spotifyURI?: string; // Optional field for Spotify URI
	points: number;
}

/**
 * Represents a specific edition or round of a contest.
 */
export interface Edition {
	id: string;
	title: string;
	phase: EditionPhase;
	optedOutParticipants: string[];
	submissions: Submission[];
	startDate: number;
	submissionDeadline: number; // Unix timestamp for the submission deadline
	votingDeadline: number; // Unix timestamp for the voting deadline
}

/**
 * Represents a complete contest, including all its editions and participants.
 */
export interface Contest {
	id: string;
	title: string;
	description?: string;
	participants: Participant[];
	joinCode: string;
	hostId: string;
	editions: Edition[];
}

export interface User {
	id: string;
	name: string;
	email: string;
}
