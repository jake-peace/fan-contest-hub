import { type Schema } from '../../data/resource';
import { v4 } from 'uuid';
import { generateClient } from "aws-amplify/data";
import { Amplify } from 'aws-amplify';
import amplifyOutputs from '../../../amplify_outputs.json'

type Vote = Schema['Vote']['type'];

const rankingPoints = new Map<number, number>([
    [1, 12],
    [2, 10],
    [3, 8],
    [4, 7],
    [5, 6],
    [6, 5],
    [7, 4],
    [8, 3],
    [9, 2],
    [10, 1]
]);

import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/submit-batch-votes'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);

Amplify.configure(resourceConfig, libraryOptions);

// 2. Generate the client after configuring
const client = generateClient<Schema>();

export const handler: Schema['submitBatchVotes']['functionHandler'] = async (event) => {
  const { ranking, user } = event.arguments;

  const getPointsByRank = (rank: number): number | undefined => {
        return rankingPoints.get(rank);
    }

  if (!ranking || ranking.length === 0) {
    return 'No ranking found';
  }

  try {
    const newId = v4();
    const response = await client.models.Vote.create({
        voteId: newId,
        submissionId: ranking[0] as string,
        points: getPointsByRank(1) as number,
        fromUserId: user as string,
    })

    console.log(JSON.stringify(response))
    // const array: any[] = []
    // ranking.map(async (vote, index) => {
    //   const result = await client.models.Vote.create({
    //     voteId: v4(),
    //     submissionId: vote as string,
    //     points: getPointsByRank(index + 1) as number,
    //     fromUserId: user as string,
    //   })
    //   array.push(result)

    return `Success`;

  } catch (error) {
    console.error('Batch create failed:', error);
    return `Failure due to ${error}`;
  }
};