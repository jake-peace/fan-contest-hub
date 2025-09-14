import { Plus, Settings } from "lucide-react";
import { Button } from "../ui/button"

const ContestOptions: React.FC = () => {
    return (
        <div className="flex items-center gap-2 mt-2">
            <Button>
                <Plus className="h-4 w-4" />
                Create Edition
            </Button>
            <Button variant='secondary'>
                <Settings className="h-4 w-4" />
                Options
            </Button>
        </div>
    )
}

export default ContestOptions;