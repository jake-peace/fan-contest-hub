'use client';

import { AuthUser } from 'aws-amplify/auth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardTitle } from '../ui/card';
import { fetchProfiles } from '../ResultsComponent';
import { Spinner } from '../ui/spinner';
import { AlertCircleIcon, Check, CircleEllipsis, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { SelectionSet } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import Avatar from 'boring-avatars';

interface EditionStatusParams {
	editionId: string;
	user: AuthUser;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const editionSelectionSet = [
	'contest.participants',
	'phase',
	'contest.hostId',
	'rankings.userId',
	'submissions.userId',
	'savedRankings.userId',
] as const;
type Edition = SelectionSet<Schema['Edition']['type'], typeof editionSelectionSet>;

const fetchEditionStatus = async (id: string) => {
	const response = await fetch(`/api/editions/${id}/status`);

	if (!response.ok) {
		throw new Error('Failed to fetch data from the server.');
	}

	const result = await response.json();
	return result.edition as Edition;
};

const EditionStatus: React.FC<EditionStatusParams> = ({ editionId, user }) => {
	const {
		data: edition,
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
			if (edition?.contest.hostId !== user.userId && process.env.NODE_ENV !== 'development') {
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
							<div className="flex gap-2 items-center">
								<Avatar name={profile.userId as string} variant="beam" size={20} />
								{profile.displayName}
							</div>
							{edition?.phase === 'SUBMISSION' ? (
								edition.submissions.some((sub) => sub.userId === profile.userId) && (
									<div className="flex items-center gap-1 text-(--success)">
										Submitted
										<Check />
									</div>
								)
							) : !edition?.submissions.some((sub) => sub.userId === profile.userId) ? (
								<div className="flex items-center gap-1 text-(--destructive)">
									Did not submit a song
									<TriangleAlert />
								</div>
							) : edition?.rankings.some((sub) => sub.userId === profile.userId) ? (
								<div className="flex items-center gap-1 text-(--success)">
									Voted
									<Check />
								</div>
							) : (
								edition?.savedRankings.some((sub) => sub.userId === profile.userId) && (
									<div className="flex items-center gap-1">
										Has started voting
										<CircleEllipsis />
									</div>
								)
							)}
						</div>
					</Card>
				))}
		</Card>
	);
};

export default EditionStatus;
