import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { submitBatchVotes } from '../function/submit-batch-votes/resource';
import { spotifyApi } from '../function/spotifyApi/resource';
import { phaseUpdater } from '../function/phaseUpdater/resource';
import { postConfirmationHandler } from '../function/postConfirmationTrigger/resource';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a
	.schema({
		Profile: a
			.model({
				userId: a.id(),
				displayName: a.string(),
			})
			.identifier(['userId'])
			.authorization((allow) => [allow.authenticated().to(['read']), allow.ownerDefinedIn('userId').to(['update'])]),
		Contest: a
			.model({
				contestId: a.id(),
				name: a.string().required(),
				description: a.string(),
				joinCode: a.string(),
				hostId: a.string(),
				editions: a.hasMany('Edition', 'contestId'),
				participants: a
					.string()
					.array()
					.authorization((allow) => allow.authenticated()),
			})
			.identifier(['contestId'])
			.authorization((allow) => [allow.ownersDefinedIn('participants'), allow.authenticated().to(['list', 'get'])]),
		Phase: a.enum(['UPCOMING', 'SUBMISSION', 'VOTING', 'RESULTS', 'COMPLETE']),
		CloseType: a.enum(['specificDate', 'allEntries', 'manually']),
		Edition: a
			.model({
				editionId: a.id(),
				contestId: a.id(),
				name: a.string().required(),
				description: a.string(),
				contest: a.belongsTo('Contest', 'contestId'),
				submissions: a.hasMany('Submission', 'editionId'),
				submissionsOpen: a.datetime(),
				submissionDeadline: a.datetime(),
				votingDeadline: a.datetime(),
				closeSubmissionType: a.ref('CloseType'),
				closeVotingType: a.ref('CloseType'),
				phase: a.ref('Phase').required(),
				resultsRevealed: a.boolean(),
				spotifyPlaylistLink: a.string(),
			})
			.identifier(['editionId'])
			.authorization((allow) => allow.authenticated()),
		Submission: a
			.model({
				userId: a.id(),
				submissionId: a.id().required(),
				runningOrder: a.integer(),
				songTitle: a.string().required(),
				artistName: a.string().required(),
				spotifyUri: a.string(),
				editionId: a.id(),
				flag: a.string(),
				countryName: a.string(),
				edition: a.belongsTo('Edition', 'editionId'),
				votes: a.hasMany('Vote', 'voteId'),
				rejected: a.boolean(),
			})
			.identifier(['submissionId'])
			.authorization((allow) => [allow.authenticated()]),
		Vote: a
			.model({
				voteId: a.id().required(),
				submissionId: a.id().required(),
				submission: a.belongsTo('Submission', 'voteId'),
				points: a.integer().required(),
				fromUserId: a.id().required(),
			})
			.identifier(['voteId'])
			.authorization((allow) => allow.authenticated()),
		submitBatchVotes: a
			.query()
			.arguments({
				ranking: a.string().array(),
				user: a.id(),
			})
			.returns(a.string())
			.authorization((allow) => allow.authenticated())
			.handler(a.handler.function(submitBatchVotes)),
		spotifyApi: a
			.query()
			.returns(a.string())
			.authorization((allow) => allow.authenticated())
			.handler(a.handler.function(spotifyApi)),
	})
	.authorization((allow) => [
		allow.resource(submitBatchVotes),
		allow.resource(spotifyApi),
		allow.resource(phaseUpdater),
		allow.resource(postConfirmationHandler),
	]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
	schema,
	authorizationModes: {
		defaultAuthorizationMode: 'identityPool',
	},
});
