import { Music } from "lucide-react"
import { Card, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import EditionList from "../EditionList"
import { useAppSelector } from "@/app/store/hooks"
import { Spinner } from "../ui/spinner"
import ContestOptions from "../ContestOptions"
import { User } from "@/types/Contest"

const ContestInfoCard: React.FC = () => {
    const contest = useAppSelector((state) => state.contest.contest);
    const currentUser = useAppSelector((state) => state.user.user);

    if (!contest) {
        return (
            <Spinner />
        )
    }

    return (
        <>
            <Card className="mb-4 py-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Music className="w-5 h-5" />
                            {contest.title}
                        </CardTitle>
                        <Badge variant="secondary">
                            {contest.participants.length} participants
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{contest.description}</p>
                    {(currentUser as User).id === contest.hostId && <ContestOptions />}
                </CardHeader>
            </Card>

            <EditionList contest={contest} />
        </>
    )
}

export default ContestInfoCard;