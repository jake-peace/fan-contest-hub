import { Plus, Settings, Trash } from "lucide-react";
import { Button } from "../ui/button"
import { useAppSelector } from "@/app/store/hooks";
import { useAmplifyClient } from "@/app/amplifyConfig";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

const ContestOptions: React.FC = () => {
    const contestId = useAppSelector((state) => state.contest.contestId);
    const client = useAmplifyClient();
    const router = useRouter();
    const queryClient = useQueryClient();

    const onDeleteContest = async () => {
        try {
            await client.models.Contest.delete({ contestId: contestId })
            toast.success('Contest successfully deleted')
            queryClient.invalidateQueries({ queryKey: ['userContestList'] })
            router.push('/')
        } catch {
            toast.error('Error when trying to delete contest');
        }
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <Button onClick={() => router.push('/create/edition')}>
                <Plus className="h-4 w-4" />
                Create Edition
            </Button>
            <Button variant='secondary'>
                <Settings className="h-4 w-4" />
                Options
            </Button>
            <AlertDialog>
                <AlertDialogTrigger>
                    <Trash className="h-4 w-4" />
                </AlertDialogTrigger>
                <AlertDialogContent className=''>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove your data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteContest()}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}

export default ContestOptions;