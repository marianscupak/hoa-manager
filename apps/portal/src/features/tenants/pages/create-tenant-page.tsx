import { Form, FormInput } from "@hoa-mngr/ui";

import { useCreateTenant } from "../hooks/use-create-tenant";

export function CreateTenantPage() {
    const { form, handleCreateTenant, isPending, isError } = useCreateTenant();

    return (
        <div className="bg-card w-full rounded-xl border p-8 shadow-sm">
            <h1 className="text-foreground mb-2 text-center text-2xl font-bold tracking-tight">
                Create a Community
            </h1>
            <p className="text-muted-foreground mb-6 text-center text-sm">
                Start managing your HOA right away by creating a new community.
                You will automatically become an administrator.
            </p>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleCreateTenant)}
                    className="space-y-4"
                >
                    <FormInput
                        name="name"
                        label="Community Name"
                        placeholder="e.g. Sunny Vistas Community"
                        disabled={isPending}
                    />

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary flex w-full justify-center rounded-md px-3 py-2 text-sm leading-6 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                        >
                            {isPending
                                ? "Creating and joining..."
                                : "Create Community"}
                        </button>
                        {isError && (
                            <p className="text-destructive mt-2 text-center text-sm">
                                Failed to create community. Please try again.
                            </p>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
