import { Schema } from '../../amplify/data/resource';

type Submission = Schema['Submission']['type'];
type Contest = Schema['Contest']['type'];
type Edition = Schema['Edition']['type'];
type Ranking = Schema['Ranking']['type'];

export interface EditionWithDetails extends Edition {
	contestDetails: Contest;
	submissionList?: Submission[];
	rankingsList?: Ranking[];
}
