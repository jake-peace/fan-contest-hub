'use client';

import { AuthUser } from 'aws-amplify/auth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardTitle } from '../ui/card';
import { fetchProfiles } from '../ResultsComponent';
import { Spinner } from '../ui/spinner';
import { AlertCircleIcon, Check } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface EditionStatusParams {
	editionId: string;
	user: AuthUser;
}

interface ParticipantsWithPhase {
	actionedParticipants: string[];
	phase: 'SUBMISSION' | 'VOTING' | 'RESULTS';
	contestHost: string;
}

const fetchEditionStatus = async (id: string) => {
	const response = await fetch(`/api/editions/${id}/status`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.data as ParticipantsWithPhase;
};

const EditionStatus: React.FC<EditionStatusParams> = ({ editionId, user }) => {
	const {
		data: actioned,
		isLoading,
		isFetched,
	} = useQuery({
		queryKey: ['editionDetailsStatus', editionId],
		queryFn: () => fetchEditionStatus(editionId),
	});

	const { data: profiles, isLoading: isProfilesLoading } = useQuery({
		queryKey: ['statusProfiles', editionId],
		queryFn: () => fetchProfiles(editionId),
	});

	const router = useRouter();

	useEffect(() => {
		if (isFetched) {
			if (actioned?.contestHost !== user.userId) {
				toast.error('You must be the contest host to see this page');
				router.back();
			}
		}
	}, [isFetched]);

	if (isLoading || isProfilesLoading) {
		return <Spinner />;
	}

	return (
		<Card className="mb-4 p-6 gap-2">
			<CardTitle>Participant Status</CardTitle>
			<Alert>
				<AlertCircleIcon />
				<AlertDescription>
					This page is in beta and may not be accurate. If a participant did not submit a song, they will not appear as having voted in this
					list.
				</AlertDescription>
			</Alert>
			{profiles &&
				profiles.map((profile) => (
					<Card className="p-2" key={profile.userId}>
						<div className="flex items-center justify-between gap-3">
							<div>{profile.displayName}</div>
							{actioned?.actionedParticipants?.includes(profile.userId as string) && (
								<div className="flex items-center gap-1 text-(--success)">
									{actioned.phase === 'SUBMISSION' ? 'Submitted' : 'Voted'}
									<Check />
								</div>
							)}
						</div>
					</Card>
				))}
		</Card>
	);
};

export default EditionStatus;
