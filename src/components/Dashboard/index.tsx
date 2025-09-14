'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockContests as MC } from "@/mockData/newMockData";
import { Contest } from "@/types/Contest";
import { CircleDashed, Clock, Hash, Music, Plus, Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { getActiveEdition } from "@/utils";
import { useAppDispatch } from "@/app/store/hooks";
import { setContest } from "@/app/store/reducers/contestReducer";
import type { Schema } from '../../../amplify/data/resource'
import { generateClient } from 'aws-amplify/data'

const client = generateClient<Schema>()

const DashboardPage: React.FC = () => {

    const router = useRouter()
    const dispatch = useAppDispatch();

    const createTodo = async () => {
        await client.models.Todo.create({
            content: window.prompt("Todo content?"),
            isDone: false
        })
    }

    const getPhaseColor = (contest: Contest) => {
        const activeEdition = getActiveEdition(contest);
        if (activeEdition) {
            switch (activeEdition.phase) {
                case 'SUBMISSION': return 'default';
                case 'VOTING': return 'secondary';
                case 'RESULTS': return 'destructive';
                default: return 'outline';
            }
        } else {
            return 'outline'
        }
    };

    const getPhaseIcon = (contest: Contest) => {
        const activeEdition = getActiveEdition(contest);
        if (activeEdition) {
            switch (activeEdition.phase) {
                case 'SUBMISSION': return <Music className="w-3 h-3" />;
                case 'VOTING': return <Users className="w-3 h-3" />;
                case 'RESULTS': return <Trophy className="w-3 h-3" />;
                default: return <CircleDashed className="w-3 h-3" />;
            }
        } else {
            return <CircleDashed className="w-3 h-3" />;
        }
    };

    const getEditionName = (contest: Contest) => {
        const activeEdition = getActiveEdition(contest);
        if (activeEdition) {
            return activeEdition.title;
        } else {
            return 'No editions';
        }
    };

    // const onJoinContest = (id: string) => {
    //     console.log('join contest', id);
    // }

    const [joinCode] = useState('hello');
    const [mockContests, setMockContests] = useState<Contest[]>([]);

    useEffect(() => {
        setMockContests(MC);
    }, []);

    const onSelectContest = (contest: Contest) => {
        dispatch(setContest(contest));
        router.push(`/contest`)
    }

    // Dashboard page should have:
    // - Header
    // - Create contest button
    // - Join contest card
    // - List of contests

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-md mx-auto">

                <Button onClick={createTodo}>
                    Bullshit button
                </Button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Music className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="mb-2">Song Contest</h1>
                    <p className="text-muted-foreground">
                        Create contests, submit songs, and vote for the winner!
                    </p>
                </div>

                <ThemeToggle />

                <div className="space-y-4 mb-6">
                    {/* Create contest button */}
                    <Button
                        onClick={() => router.push('/create/contest')}
                        className="w-full h-12"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Contest
                    </Button>

                    {/* Join contest card */}
                    <Card className="py-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="w-5 h-5" />
                                Join with Code
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label htmlFor="join-code">Contest Code</Label>
                                <Input
                                    id="join-code"
                                    value={joinCode}
                                    onChange={(e) => console.log(e.target.value.toUpperCase())}
                                    placeholder="Enter contest code"
                                    className="uppercase"
                                />
                            </div>
                            <Button
                                onClick={() => console.log('handle join with code')}
                                variant="outline"
                                className="w-full"
                                disabled={!joinCode.trim()}
                            >
                                Join Contest
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* List of contests */}
                {mockContests.length > 0 && (
                    <div>
                        <h2 className="mb-4">Active Contests</h2>
                        <div className="space-y-3">
                            {mockContests.map((contest: Contest) => (
                                <Card
                                    key={contest.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => onSelectContest(contest)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium truncate">{contest.title}</h3>
                                            <Badge variant={getPhaseColor(contest)} className="text-xs">
                                                {getPhaseIcon(contest)}
                                                {/* <span className="ml-1 capitalize">{contest.editions[0].phase}</span> */}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {contest.participants.length}
                                            </span>
                                            <h3 className="font-medium truncate">{getEditionName(contest)}</h3>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {/* {new Date(contest.editions[0].submissionDeadline).toLocaleDateString()} */}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;
