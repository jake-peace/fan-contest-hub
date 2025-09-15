'use client'

import { Button } from "@/components/ui/button";
import ContestInfoCard from "@/components/ContestCard";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { users } from "@/mockData/newMockData";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useState } from "react";
import EditionDetails from "@/components/EditionDetails";
import SongSubmission from "@/components/SongSubmission";
import { clearContest, clearEdition } from "../store/reducers/contestReducer";
import { useQueryClient } from "@tanstack/react-query";

const currentUserId = 'user_alpha';

type EditionView = 'OVERVIEW' | 'SUBMISSION' | 'VOTING' | 'RESULTS';

const ContestPage: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    // const contest = useAppSelector((store) => store.contest.contest);
    const editionId = useAppSelector((store) => store.contest.editionId);

    const currentUser = users.filter((user) => user.id === currentUserId)[0];
    const [editionView, setEditionView] = useState<EditionView>('OVERVIEW');

    // if (!contest || !currentUser) {
    //     router.push('/')
    // };

    // Contest page:
    // - Top navigation
    // - Main content, any of: 
    //      - Contest overview
    //      - Single edition view
    //      - Song submission
    //      - Voting page
    //      - Results page

    const renderEditionContent = () => {
        if (editionId) {
            switch (editionView) {
                case 'OVERVIEW':
                    return <EditionDetails edition={editionId} onSubmitSong={() => setEditionView('SUBMISSION')} />;
                case 'SUBMISSION':
                    return <SongSubmission onBack={() => setEditionView('OVERVIEW')} />;
                case 'VOTING':
                    return <Spinner />;
                case 'RESULTS':
                    return <Spinner />;
                default:
                    return <Spinner />; // Always have a default case to return something (or null)
            }
        }
    };

    const getBackAction = () => {
        if (editionId) {
            if (editionView === 'OVERVIEW') {
                console.log('INVALIDATING')
                queryClient.removeQueries({ queryKey: ['editionInfoQuery'] })
                dispatch(clearEdition());
            } else {
                setEditionView('OVERVIEW');
            }
        } else {
            dispatch(clearContest());
            router.push('/');
        };
    };

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-md mx-auto">

                {/* Top navigation */}
                <Button
                    variant="ghost"
                    onClick={getBackAction}
                    className="mb-4"
                >
                    ← Back
                </Button>

                {/* Main content */}
                {editionId !== undefined ? renderEditionContent() :
                    (<ContestInfoCard />)}
            </div>
        </div>
    )
}

export default ContestPage;