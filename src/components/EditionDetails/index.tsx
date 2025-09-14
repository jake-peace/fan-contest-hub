import { Contest, Edition } from "@/types/Contest"
import { Progress } from "@radix-ui/react-progress";
import { Clock, Vote, Users, Share, Crown, Music, Trophy, Upload, Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { EditionPhase } from "@/mockData/newMockData";
import { formatDate, getPhaseMessage } from "@/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface EditionDetailsProps {
    contest: Contest;
    edition: Edition;
    onSubmitSong: () => void;
}

const EditionDetails: React.FC<EditionDetailsProps> = ({ contest, edition, onSubmitSong }) => {

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
        if (edition) {
            if (edition.phase === 'SUBMISSION') {
                return (
                    <Button onClick={onSubmitSong} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Your Song
                    </Button>
                );
            }

            if (edition.phase === 'VOTING') {
                return (
                    <Button onClick={() => console.log('vote')} className="w-full">
                        <Vote className="w-4 h-4 mr-2" />
                        Vote Now
                    </Button>
                );
            }

            if (edition.phase === 'RESULTS' || edition.phase === 'COMPLETE') {
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
            <Card className="mb-4 py-6" >
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            {edition.title}
                        </CardTitle>
                        <Badge variant={getPhaseColor(edition.phase)} className="text-xs bg-blue-500 text-white dark:bg-blue-600">
                            {getPhaseIcon(edition.phase)}
                            <span className="ml-1 capitalize">{edition.phase}</span>
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{'hello'}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Submissions open from
                            </span>
                            <span>{formatDate(edition.startDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Submission Due
                            </span>
                            <span>{formatDate(edition.submissionDeadline)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Vote className="w-4 h-4" />
                                Voting Due
                            </span>
                            <span>{formatDate(edition.votingDeadline)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Participants
                            </span>
                            <span>{contest.participants.length}</span>
                        </div>

                        {edition.phase === 'SUBMISSION' && (
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>Submissions</span>
                                    <span>{edition.submissions.length}/{contest.participants.length}</span>
                                </div>
                                <Progress value={22} className="h-2" />
                            </div>
                        )}

                        {edition.phase === 'VOTING' && (
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
            </Card>
        </>
    )
}

export default EditionDetails;
