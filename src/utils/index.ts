import { Contest, Edition } from "@/types/Contest";
import { format, fromUnixTime } from "date-fns";

export const getActiveEdition = (contest: Contest): Edition | undefined => {
    if (contest.editions.length > 0) {
        const activeEdition = contest.editions.filter((edition) => edition.phase !== 'COMPLETE' && edition.phase !== 'UPCOMING');
        if (activeEdition.length === 1) {
            return activeEdition[0];
        } else {
            return contest.editions.sort((a, b) => { return b.votingDeadline - a.votingDeadline })[0];
        }
    } else {
        return undefined;
    }
}

export const formatDate = (unixDate: number): string => {
    return format(fromUnixTime(unixDate), 'eee do MMM y, HH:mm');
}

export const sortedEditions = (contest: Contest): Edition[] => {
    return [...contest.editions].sort((a, b) => {
        if ((a.phase !== 'COMPLETE' && a.phase !== 'UPCOMING') && (b.phase === 'COMPLETE' || b.phase === 'UPCOMING')) return -1;
        if ((a.phase === 'COMPLETE' || a.phase === 'UPCOMING') && (b.phase !== 'COMPLETE' && b.phase !== 'UPCOMING')) return 1;
        return b.votingDeadline - a.votingDeadline;
    })
}

export const getPhaseMessage = (edition: Edition) => {
    switch (edition.phase) {
        case 'UPCOMING':
            return `Waiting for host to open submissions`;
        case 'SUBMISSION':
            return 'Waiting for song submissions';
        case 'VOTING':
            return 'Voting is now open!';
        case 'RESULTS':
            return 'All votes are in - results available';
        case 'COMPLETE':
            return 'Congrats to {insert winner here}!'
        default:
            return '';
    }
};
