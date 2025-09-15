import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

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
    phase: a.enum(['SUBMISSION', 'VOTING', 'RESULTS', 'COMPLETE']),
  }).identifier(['editionId'])
  .authorization(allow => [allow.ownersDefinedIn('participants')]),
  Submission: a.model({
    userId: a.id(),
    submissionId: a.id(),
    songTitle: a.string().required(),
    artistName: a.string().required(),
    spotifyUri: a.string(),
    editionId: a.id(),
    edition: a.belongsTo('Edition', 'editionId'),
    votes: a.hasMany('Vote', 'submissionId')
  }).identifier(['submissionId'])
  .authorization(allow => allow.guest()),
  Vote: a.model({
    points: a.integer().required(),
    submissionId: a.id().required(),
    submission: a.belongsTo('Submission', 'submissionId'),
    fromUserId: a.id().required(),
  }).identifier(['submissionId', 'fromUserId'])
  .authorization(allow => allow.guest()),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});
