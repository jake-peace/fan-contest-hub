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

const currentUserId = 'user_alpha';

type EditionView = 'OVERVIEW' | 'SUBMISSION' | 'VOTING' | 'RESULTS';

const ContestPage: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const contest = useAppSelector((store) => store.contest.contest);
    const edition = useAppSelector((store) => store.contest.edition);

    const currentUser = users.filter((user) => user.id === currentUserId)[0];
    const [editionView, setEditionView] = useState<EditionView>('OVERVIEW');

    if (!contest || !currentUser) {
        router.push('/')
    };

    // Contest page:
    // - Top navigation
    // - Main content, any of: 
    //      - Contest overview
    //      - Single edition view
    //      - Song submission
    //      - Voting page
    //      - Results page

    const renderEditionContent = () => {
        if (contest && edition) {
            switch (editionView) {
                case 'OVERVIEW':
                    return <EditionDetails contest={contest} edition={edition} onSubmitSong={() => setEditionView('SUBMISSION')} />;
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
        if (edition) {
            if (editionView === 'OVERVIEW') {
                dispatch(clearEdition());
            } else {
                setEditionView('OVERVIEW');
            }
        } else if (contest) {
            dispatch(clearContest());
            router.back();
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
                {edition !== undefined ? renderEditionContent() :
                    (<ContestInfoCard />)}
            </div>
        </div>
    )
}

export default ContestPage;