import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { submitBatchVotes } from '../function/submit-batch-votes/resource';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Contest: a.model({
    contestId: a.id(),
    name: a.string().required(),
    description: a.string(),
    joinCode: a.string(),
    hostId: a.string(),
    editions: a.hasMany('Edition', 'contestId'),
    participants: a.string().array(),
  }).identifier(['contestId'])
  .authorization(allow => [allow.owner()]),
  Phase: a.enum([
    'UPCOMING',
    'SUBMISSION',
    'VOTING',
    'RESULTS',
    'COMPLETE'
  ]),
  Edition: a.model({
    editionId: a.id(),
    contestId: a.id(),
    name: a.string().required(),
    description: a.string(),
    contest: a.belongsTo('Contest', 'contestId'),
    submissions: a.hasMany('Submission', 'editionId'),
    submissionsOpen: a.timestamp(),
    submissionDeadline: a.timestamp(),
    votingDeadline: a.timestamp(),
    phase: a.ref('Phase').required(),
  }).identifier(['editionId'])
  .authorization(allow => [allow.ownersDefinedIn('participants')]),
  Submission: a.model({
    userId: a.id(),
    submissionId: a.id().required(),
    songTitle: a.string().required(),
    artistName: a.string().required(),
    spotifyUri: a.string(),
    editionId: a.id(),
    flag: a.string(),
    countryName: a.string(),
    edition: a.belongsTo('Edition', 'editionId'),
    votes: a.hasMany('Vote', 'voteId')
  }).identifier(['submissionId'])
  .authorization(allow => [allow.ownersDefinedIn('participants')]),
  Vote: a.model({
    voteId: a.id().required(),
    submissionId: a.id().required(),
    submission: a.belongsTo('Submission', 'voteId'),
    points: a.integer().required(),
    fromUserId: a.id().required(),
  }).identifier(['voteId'])
  .authorization(allow => allow.authenticated()),
  submitBatchVotes: a
    .query()
    .arguments({
      ranking: a.string().array(),
      user: a.id(),
    })
    .returns(a.string())
    .authorization(allow => allow.authenticated())
    .handler(a.handler.function(submitBatchVotes)),
})
.authorization(allow => allow.resource(submitBatchVotes));

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});

// loop through each point in the current round
            // const revealNextPoint = (pointIndex: number) => {
            //     if (pointIndex >= currentUserVotes.length) {
            //         // all points for this user have been revealed
            //         console.log('Finish round')
            //         const endRoundTimer = setTimeout(() => {
            //             setCurrentVoter(null);
            //             setVotingIndex(prev => prev + 1);
            //         }, 3000);
            //         return () => clearTimeout(endRoundTimer);
            //     }

            //     const pointsToReveal = currentUserVotes[pointIndex];
            //     const updatedSongs = [...submissions];
            //     const songToUpdate = updatedSongs.find(song => song.submissionId === pointsToReveal.submissionId);

            //     if (songToUpdate) {
            //         songToUpdate.score += pointsToReveal.points;
            //     }

            //     updatedSongs.sort((a, b) => b.score - a.score);
            //     setSubmissions(updatedSongs);
            //     setCurrentPointIndex(pointIndex);

            //     const nextPointTimer = setTimeout(() => {
            //         revealNextPoint(pointIndex + 1);
            //     }, 2000); // Short delay between point reveals
            //     return () => clearTimeout(nextPointTimer);
            // };

            // // Start the point reveal loop
            // const initialPointTimer = setTimeout(() => {
            //     revealNextPoint(0);
            // }, 3000); // Delay for voter card display