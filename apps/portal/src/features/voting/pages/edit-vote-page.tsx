import { useParams } from "react-router";

import { CreateVoteWizard } from "../components/create-vote-wizard";

export function EditVotePage() {
    const { id } = useParams<{ id: string }>();

    if (!id) return null;

    return <CreateVoteWizard voteId={id} />;
}
