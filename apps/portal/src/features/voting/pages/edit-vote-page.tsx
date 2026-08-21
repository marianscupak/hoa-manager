import { useParams } from "react-router";

import { CreateVoteWizard } from "../components/create-vote-wizard";

export function EditVotePage() {
    const { id } = useParams<{ id: string }>();

    if (!id) return null;

    return (
        <div className="bg-background min-h-screen">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
                <CreateVoteWizard voteId={id} />
            </div>
        </div>
    );
}
