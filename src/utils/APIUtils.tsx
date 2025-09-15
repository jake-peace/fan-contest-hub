/* eslint-disable @typescript-eslint/no-explicit-any */

export const createContest = async (client: any, newContest: { contestId: string, title: string; description?: string; hostId: string; }) => {
    const { errors, data: createdContest } = await client.models.Contest.create(
        {
            contestId: newContest.contestId,
            name: newContest.title,
            description: newContest.description,
            hostId: newContest.hostId,
            participants: [newContest.hostId],
        })
    return { errors, createdContest };
}

export const createEdition = async (client: any, newEdition: { id: string, contestId: string, name: string, description: string, open?: number, subDeadline?: number, voteDeadline?: number }) => {
    const { errors, data: createdEdition } = await client.models.Edition.create(
        {
            editionId: newEdition.id,
            contestId: newEdition.contestId,
            name: newEdition.name,
            description: newEdition.description,
            submissionDeadline: newEdition.subDeadline,
            submissionsOpen: newEdition.open,
            votingDeadline: newEdition.voteDeadline,
            phase: 'SUBMISSION',
        })
    return { errors, createdEdition };
}
