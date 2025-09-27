/* eslint-disable @typescript-eslint/no-explicit-any */

export const createContest = async (
	client: any,
	newContest: { contestId: string; title: string; description?: string; hostId: string }
) => {
	const { errors, data: createdContest } = await client.models.Contest.create({
		contestId: newContest.contestId,
		name: newContest.title,
		description: newContest.description,
		hostId: newContest.hostId,
		participants: [newContest.hostId],
	});
	return { errors, createdContest };
};

export const createEdition = async (
	client: any,
	newEdition: {
		id: string;
		contestId: string;
		name: string;
		description: string;
		open?: number;
		subDeadline?: number;
		voteDeadline?: number;
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
		phase: 'SUBMISSION',
	});
	return { errors, createdEdition };
};

export const submitSong = async (
	client: any,
	submission: {
		submissionId: string;
		userId: string;
		songTitle: string;
		artistName: string;
		spotifyUri?: string;
		editionId: string;
		flag?: string;
		countryName?: string;
	}
) => {
	const { errors, data: submissionData } = await client.models.Submission.create({
		submissionId: submission.submissionId,
		userId: submission.userId,
		songTitle: submission.songTitle,
		artistName: submission.artistName,
		spotifyUri: submission.spotifyUri,
		editionId: submission.editionId,
		flag: submission.flag,
		countryName: submission.countryName,
	});
	return { errors, submissionData };
};

export const closeSubmissions = async (client: any, editionId: string) => {
	const { errors, data: newEdition } = await client.models.Edition.update({
		editionId: editionId,
		phase: 'VOTING',
	});
	return { errors, newEdition };
};

export const closeVoting = async (client: any, editionId: string) => {
	const { errors, data: newEdition } = await client.models.Edition.update({
		editionId: editionId,
		phase: 'RESULTS',
	});
	return { errors, newEdition };
};
