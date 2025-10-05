/* eslint-disable @typescript-eslint/no-explicit-any */

export const createEdition = async (
	client: any,
	newEdition: {
		id: string;
		contestId: string;
		name: string;
		description: string;
		open?: string;
		subDeadline?: string;
		voteDeadline?: string;
		closeSubmissionType: string;
		closeVotingType: string;
	}
) => {
	const { errors, data: createdEdition } = await client.models.Edition.create({
		editionId: newEdition.id,
		contestId: newEdition.contestId,
		name: newEdition.name,
		description: newEdition.description,
		submissionDeadline: newEdition.subDeadline,
		submissionsOpen: newEdition.open,
		votingDeadline: newEdition.voteDeadline,
		closeSubmissionType: newEdition.closeSubmissionType,
		closeVotingType: newEdition.closeVotingType,
		phase: 'UPCOMING',
	});
	return { errors, createdEdition };
};

export const joinContest = async (client: any, userId: string, contestId: string) => {
	const { data: contest } = await client.models.Contest.get({ contestId: contestId });
	if (contest.participants.includes(userId)) {
		throw new Error('Already in contest');
	}
	const newParticipants = [...(contest.participants ?? []), userId];
	const { errors, data: updatedContest } = await client.models.Contest.update({
		contestId: contestId,
		participants: newParticipants,
	});
	return { errors, updatedContest };
};
