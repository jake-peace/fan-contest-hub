// 'use client';

// import { Button } from '@/components/ui/button';
// import ContestInfoCard from '@/components/ContestCard';
// import { useRouter } from 'next/navigation';
// import { Spinner } from '@/components/ui/spinner';
// import { useAppDispatch, useAppSelector } from '../store/hooks';
// import { useState } from 'react';
// import EditionDetails from '@/components/EditionDetails';
// import SongSubmission from '@/components/SongSubmission';
// import { clearContest, clearEdition } from '../store/reducers/contestReducer';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import VotingComponent from '@/components/VotingComponent';
// import ResultsComponent from '@/components/ResultsComponent';
// import { useAmplifyClient } from '../amplifyConfig';
// import { toast } from 'sonner';
// import { Schema } from '../../../amplify/data/resource';

// type EditionView = 'OVERVIEW' | 'SUBMISSION' | 'VOTING' | 'RESULTS';
// type Edition = Schema['Edition']['type'];
// type Submission = Schema['Submission']['type'];
// type Contest = Schema['Contest']['type'];
// type Vote = Schema['Vote']['type'];

// const ContestPage: React.FC = () => {
// 	const router = useRouter();
// 	const dispatch = useAppDispatch();
// 	const queryClient = useQueryClient();
// 	const client = useAmplifyClient();
// 	// const contest = useAppSelector((store) => store.contest.contest);
// 	const editionId = useAppSelector((store) => store.contest.editionId);
// 	const [editionView, setEditionView] = useState<EditionView>('OVERVIEW');
// 	const [submissions, setSubmissions] = useState<Submission[]>([]);
// 	const [contest, setContest] = useState<Contest>();
// 	const [votes, setVotes] = useState<Vote[]>([]);

// 	const {
// 		data: editionData,
// 		isLoading,
// 		isFetched,
// 	} = useQuery({
// 		queryKey: ['editionInfoQuery'],
// 		queryFn: async () => {
// 			const response = await client.models.Edition.get({
// 				editionId: editionId,
// 			});
// 			const responseData = response.data;
// 			console.log(responseData);
// 			if (!responseData) {
// 				toast.error('Edition not found');
// 			} else {
// 				const { data: submissionsResp } = await responseData.submissions();
// 				const { data: contestResp } = await responseData.contest();
// 				setSubmissions(submissionsResp);
// 				setContest(contestResp as Contest);
// 			}
// 			return responseData as unknown as Edition;
// 		},
// 		enabled: editionId !== undefined,
// 	});

// 	if (isLoading) {
// 		return <Spinner />;
// 	}

// 	const renderEditionContent = () => {
// 		if (editionId && isFetched) {
// 			switch (editionView) {
// 				case 'OVERVIEW':
// 					return (
// 						<EditionDetails
// 							edition={editionData as Edition}
// 							contest={contest as Contest}
// 							submissions={submissions}
// 							onSubmitSong={() => setEditionView('SUBMISSION')}
// 							onVote={() => setEditionView('VOTING')}
// 							onResults={(votes: Vote[]) => setEditionView('RESULTS')}
// 						/>
// 					);
// 				case 'SUBMISSION':
// 					return <SongSubmission edition={editionData as Edition} onBack={() => setEditionView('OVERVIEW')} />;
// 				case 'VOTING':
// 					return <VotingComponent edition={editionData as Edition} onBack={() => setEditionView('OVERVIEW')} />;
// 				case 'RESULTS':
// 					return <ResultsComponent edition={editionData as Edition} isubmissions={submissions} votes={votes} />;
// 				default:
// 					return <Spinner />; // Always have a default case to return something (or null)
// 			}
// 		}
// 	};

// 	const getBackAction = () => {
// 		if (editionId) {
// 			if (editionView === 'OVERVIEW') {
// 				queryClient.removeQueries({ queryKey: ['editionInfoQuery'] });
// 				dispatch(clearEdition());
// 			} else {
// 				setEditionView('OVERVIEW');
// 			}
// 		} else {
// 			dispatch(clearContest());
// 			router.push('/');
// 		}
// 	};

// 	return (
// 		<div className="min-h-screen bg-background p-4">
// 			<div className={editionView === 'RESULTS' ? '' : 'max-w-md mx-auto'}>
// 				{/* Top navigation */}
// 				<Button variant="ghost" onClick={getBackAction} className="mb-4">
// 					← Back
// 				</Button>

// 				{/* Main content */}
// 				{editionId !== undefined ? renderEditionContent() : <ContestInfoCard />}
// 			</div>
// 		</div>
// 	);
// };

// export default ContestPage;
