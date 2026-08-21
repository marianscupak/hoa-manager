import { CreateVoteWizard } from "../components/create-vote-wizard";

export function CreateVotePage() {
    return (
        <div className="bg-background min-h-screen">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
                <CreateVoteWizard />
            </div>
        </div>
    );
}
