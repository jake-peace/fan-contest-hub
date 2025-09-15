import { Contest } from "@/types/Contest";
import { Schema } from "../../amplify/data/resource";

interface ContestResponseData {
    name: string;
    description: string;
    joinCode: string;
    hostId: string;
    participants: string[] | null;
    readonly id: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export const convertToContest = (response: ContestResponseData): Contest => {
    const contest: Contest = {
        id: response.id,
        title: response.name as string,
        description: response.description as string | undefined,
        hostId: response.hostId as string,
        participants: [],
        joinCode: response.joinCode as string,
        editions: [],
    }
    return contest;
}
