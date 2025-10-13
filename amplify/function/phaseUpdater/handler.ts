import type { EventBridgeHandler } from 'aws-lambda';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/status-updater';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { parseISO } from 'date-fns';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

type Phase = 'UPCOMING' | 'SUBMISSION' | 'VOTING' | 'RESULTS' | 'COMPLETE';

const nextPhase = new Map<Phase, Phase>([
	['UPCOMING', 'SUBMISSION'],
	['SUBMISSION', 'VOTING'],
	['VOTING', 'RESULTS'],
]);

function shuffleArray<T>(array: T[]): T[] {
	// 1. Create a shallow copy of the array so the original is not modified.
	const newArray = [...array];

	let currentIndex = newArray.length;
	let randomIndex;

	// 2. While there remain elements to shuffle.
	while (currentIndex !== 0) {
		// 3. Pick a remaining element.
		// The cast 'as number' is often needed in TypeScript environments
		// because Math.floor returns a number, but some linting rules are strict.
		randomIndex = Math.floor(Math.random() * currentIndex) as number;
		currentIndex--;

		// 4. And swap it with the current element.
		[newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
	}

	return newArray;
}

export const handler: EventBridgeHandler<'Scheduled Event', null, void> = async (event) => {
	console.log('Scheduled status update started:', JSON.stringify(event));

	try {
		// 1. Get all events that are past their scheduled time and are not yet marked as 'COMPLETED'
		const now = new Date().toISOString();

		const parsedNow = parseISO(now);

		// NOTE: This is a conceptual query. You'll need to implement a filter
		// based on your actual data model (e.g., query by status and filter by timestamp).
		const { data: recordsToUpdate } = await client.models.Edition.list({
			filter: {
				or: [
					{
						and: [
							{
								submissionsOpen: { gt: parsedNow.toString() },
							},
							{
								phase: { eq: 'UPCOMING' },
							},
						],
					},
					{
						and: [
							{
								votingDeadline: { gt: parsedNow.toString() },
							},
							{
								phase: { eq: 'VOTING' },
							},
							{
								closeVotingType: { eq: 'specificDate' },
							},
						],
					},
				],
			},
		});

		const { data: recordsToUpdateSubmissions } = await client.models.Edition.list({
			filter: {
				// find editions where submission deadline is before the current time
				submissionDeadline: { lt: parsedNow.toString() },
				// and the phase is still 'SUBMISSION'
				phase: { eq: 'SUBMISSION' },
				closeSubmissionType: { eq: 'specificDate' },
			},
		});

		if (recordsToUpdateSubmissions.length > 0) {
			recordsToUpdateSubmissions.forEach(async (r) => {
				const submissions = (await r.submissions()).data;
				submissions.forEach(async (s) => {
					const promises = shuffleArray(submissions).map((s, index) => {
						return client.models.Submission.update({
							submissionId: s.submissionId,
							runningOrder: index,
						});
					});
					await Promise.all(promises);
				});
			});
		}

		if (recordsToUpdate.length === 0) {
			console.log('No editions to update.');
			return;
		}

		// 2. Iterate and update each record's variable (status)
		const updatePromises = recordsToUpdate.map((record) => {
			console.log(
				`Updating record ID: ${record.editionId} from ${record.phase} to ${nextPhase.get(record.phase)} because the voting deadline was ${record.votingDeadline}`
			);
			return client.models.Edition.update({
				editionId: record.editionId,
				phase: nextPhase.get(record.phase),
			});
		});

		await Promise.all(updatePromises);
		console.log(`Successfully updated ${recordsToUpdate.length} records.`);
	} catch (error) {
		console.error('Error during scheduled update:', error);
	}
};
