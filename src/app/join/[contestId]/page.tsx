'use client';

import { useAmplifyClient } from '@/app/amplifyConfig';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Schema } from '../../../../amplify/data/resource';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { setUser } from '@/app/store/reducers/userReducer';
import Loading from '@/components/Loading';

type Contest = Schema['Contest']['type'];

const JoinContestPage: React.FC = () => {
	const { contestId } = useParams();
	const client = useAmplifyClient();
	const [loggedIn, setLoggedIn] = useState(false);

	useEffect(() => {
		const getAuthUser = async () => {
			const response = await getCurrentUser();
			if (response) {
				setUser(response.userId);
				setLoggedIn(true);
			}
		};
		getAuthUser();
	}, []);

	const {
		data: contest,
		isLoading,
		isFetched,
	} = useQuery({
		queryKey: ['joinContestQuery'],
		queryFn: async () => {
			const response = await client.models.Contest.get({
				contestId: contestId as string,
			});
			const responseData = response.data;
			console.log(responseData);
			if (!responseData) {
				toast.error('Contest not found');
			}
			return responseData as unknown as Contest;
		},
		enabled: contestId !== undefined,
	});

	const handleJoinContest = async () => {
		// try {
		// 	const { errors } = await joinContest(client, userId, contest?.contestId as string);
		// 	if (!errors) {
		// 		toast.success(`Joined ${contest?.name}!`);
		// 		router.push(`/contest/${contest?.contestId}`);
		// 	}
		// } catch (error: any) {
		// 	toast.error(error.message);
		// 	router.push('/');
		// }
	};

	if (isLoading) {
		return <Loading />;
	}

	return (
		isFetched &&
		contest && (
			<div>
				<Card className="p-6 m-6 items-center">
					<div className="font-bold text-lg">Name has invited you to join</div>
					<div className="font-bold text-4xl wrap text-center">{contest.name}</div>
					{loggedIn ? (
						<Button onClick={handleJoinContest} className="w-full mt-2">
							Join
						</Button>
					) : (
						<div className="space-y-2 p-0">
							<Button className="w-full">Create an account to join</Button>
							<Button className="w-full" variant="outline">
								Login
							</Button>
						</div>
					)}
				</Card>
			</div>
		)
	);
};

export default JoinContestPage;
