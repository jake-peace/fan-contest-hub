import { defineFunction } from "@aws-amplify/backend";
import { data } from '../../data/resource'; 

export const submitBatchVotes = defineFunction({
    name: 'submit-batch-votes',
    entry: './handler.ts'
});