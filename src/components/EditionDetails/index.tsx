import { Progress } from "@radix-ui/react-progress";
import { Clock, Vote, Users, Share, Crown, Music, Trophy, Upload, Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { EditionPhase } from "@/mockData/newMockData";
import { formatDate, getPhaseMessage } from "@/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAmplifyClient } from "@/app/amplifyConfig";
import { toast } from "sonner";
import { Schema } from "../../../amplify/data/resource";
import { Spinner } from "../ui/spinner";

interface EditionDetailsProps {
    edition: string;
    onSubmitSong: () => void;
}

type Edition = Schema['Edition']['type'];
type Contest = Schema['Contest']['type'];

const EditionDetails: React.FC<EditionDetailsProps> = ({ edition, onSubmitSong }) => {
    const client = useAmplifyClient();

    const {
        data: editionData,
        isLoading,
    } = useQuery({
        queryKey: ["editionInfoQuery"],
        queryFn: async () => {
            const response = await client.models.Edition.get({
                editionId: edition,
            });
            const responseData = response.data;
            if (!responseData) {
                // router.push('/');
                toast.error('Edition not found')
            }
            return responseData as unknown as Edition;
        },
    });

    const {
        data: contest,
    } = useQuery({
        queryKey: ["editionInfoQueryContest"],
        queryFn: async () => {
            const response = await client.models.Contest.get({
                contestId: editionData?.contestId,
            });
            const responseData = response.data;
            if (!responseData) {
                // router.push('/');
                toast.error('Contest not found')
            }
            return responseData as unknown as Contest;
        },
        enabled: !!editionData,
    });

    if (isLoading) {
        return (
            <Spinner />
        )
    }

    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case 'submission': return 'default';
            case 'voting': return 'secondary';
            case 'results': return 'destructive';
            default: return 'default';
        }
    };

    const getPhaseIcon = (phase: EditionPhase) => {
        switch (phase) {
            case 'UPCOMING': return <Clock className="w-3 h-3" />;
            case 'SUBMISSION': return <Music className="w-3 h-3" />;
            case 'VOTING': return <Users className="w-3 h-3" />;
            case 'RESULTS': return <Trophy className="w-3 h-3" />;
            case 'COMPLETE': return <Crown className="w-3 h-3" />;
            default: return <Music className="w-3 h-3" />;
        }
    };

    const getActionButton = () => {
        if (editionData) {
            if (editionData.phase === 'SUBMISSION') {
                return (
                    <Button onClick={onSubmitSong} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Your Song
                    </Button>
                );
            }

            if (editionData.phase === 'VOTING') {
                return (
                    <Button onClick={() => console.log('vote')} className="w-full">
                        <Vote className="w-4 h-4 mr-2" />
                        Vote Now
                    </Button>
                );
            }

            if (editionData.phase === 'RESULTS' || editionData.phase === 'COMPLETE') {
                return (
                    <Button onClick={() => console.log('view results')} className="w-full">
                        <Trophy className="w-4 h-4 mr-2" />
                        View Results
                    </Button>
                );
            }

            return null;
        }
    };

    return (
        <>
            {editionData && <Card className="mb-4 py-6" >
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            {editionData.name}
                        </CardTitle>
                        {editionData.phase && <Badge variant={getPhaseColor(editionData.phase)} className="text-xs bg-blue-500 text-white dark:bg-blue-600">
                            {getPhaseIcon(editionData.phase)}
                            <span className="ml-1 capitalize">{editionData.phase}</span>
                        </Badge>}
                    </div>
                    <p className="text-muted-foreground">{editionData.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                        {editionData.submissionsOpen && <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Submissions open from
                            </span>
                            <span>{formatDate(editionData.submissionsOpen)}</span>
                        </div>}
                        {editionData.submissionDeadline && <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Submission Due
                            </span>
                            <span>{formatDate(editionData.submissionDeadline)}</span>
                        </div>}
                        {editionData.votingDeadline && <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Vote className="w-4 h-4" />
                                Voting Due
                            </span>
                            <span>{formatDate(editionData.votingDeadline)}</span>
                        </div>}
                    </div>

                    <div className="space-y-2">
                        {contest?.participants && <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Participants
                            </span>
                            <span>{contest.participants.length}</span>
                        </div>}

                        {editionData.phase === 'SUBMISSION' && contest?.participants && (
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>Submissions</span>
                                    <span>{editionData.submissions.length}/{contest.participants.length}</span>
                                </div>
                                <Progress value={22} className="h-2" />
                            </div>
                        )}

                        {editionData.phase === 'VOTING' && contest?.participants && (
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>Votes Cast</span>
                                    <span>{1}/{contest.participants.length}</span>
                                </div>
                                <Progress value={33} className="h-2" />
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-center">{getPhaseMessage(edition)}</p>
                    </div>

                    {edition && getActionButton()}

                    <Button
                        variant="outline"
                        onClick={() => console.log('invite friends')}
                        className="w-full"
                    >
                        <Share className="w-4 h-4 mr-2" />
                        Invite Friends
                    </Button>
                </CardContent>
            </Card>}
        </>
    )
}

export default EditionDetails;
