import { sortedEditions, getPhaseMessage } from "@/utils"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Contest, User } from "@/types/Contest"
import { useAppDispatch, useAppSelector } from "@/app/store/hooks"
import { setEdition } from "@/app/store/reducers/contestReducer"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Separator } from "../ui/separator"

interface EditionListProps {
    contest: Contest;
}

const EditionList: React.FC<EditionListProps> = ({ contest }) => {
    const dispatch = useAppDispatch();

    const currentUser = useAppSelector((state) => state.user.user);

    return (
        <Card className="mb-4 py-6">
            <CardHeader>
                <CardTitle>Editions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {contest.editions.length === 0 ? (
                    <Alert>
                        <AlertTitle>No editions yet</AlertTitle>
                        <AlertDescription>
                            {(currentUser as User).id === contest.hostId ? `This contest hasn't got any editions yet! Create one by clicking the button above`
                                : `This contest hasn't got any editions yet! Ask the host to create one and check back later`
                            }
                        </AlertDescription>
                    </Alert>
                ) : (
                    sortedEditions(contest).map((edition, index) => (
                        <div key={edition.id}>
                            <div
                                className={`p-3 rounded-lg border cursor-pointer transition-colors border-border hover:bg-muted/50`}
                                onClick={() => dispatch(setEdition(edition))}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{edition.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={
                                            edition.phase === 'UPCOMING' ? 'outline' :
                                                edition.phase === 'SUBMISSION' ? 'default' :
                                                    edition.phase === 'VOTING' ? 'secondary' : 'destructive'
                                        } className="text-xs">
                                            {edition.phase.charAt(0).toUpperCase() + edition.phase.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{getPhaseMessage(edition)}</span>
                                    <span>{contest.participants.filter((p) => !edition.optedOutParticipants.includes(p.id)).length} participants</span>
                                </div>
                            </div>
                            {index < sortedEditions.length - 1 && <Separator className="my-3" />}
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}

export default EditionList;
