import { Form, FormInput, Button } from "@hoa-mngr/ui";

import { useCreateTenant } from "../hooks/use-create-tenant";

// TODO: Add translations
export function CreateTenantPage() {
    const { form, handleCreateTenant, isPending, isError } = useCreateTenant();

    return (
        <div className="bg-card w-full rounded-xl border p-8 shadow-sm">
            <h1 className="text-foreground mb-2 text-center text-2xl font-bold tracking-tight">
                Create an Association
            </h1>
            <p className="text-muted-foreground mb-6 text-center text-sm">
                Start managing your HOA right away by creating a new
                association. You will automatically become an administrator.
            </p>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleCreateTenant)}
                    className="space-y-4"
                >
                    <FormInput
                        name="name"
                        label="Association Name"
                        placeholder="e.g. Sunny Vistas Association"
                        disabled={isPending}
                    />

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full"
                        >
                            {isPending
                                ? "Creating and joining..."
                                : "Create Association"}
                        </Button>
                        {isError && (
                            <p className="text-destructive mt-2 text-center text-sm">
                                Failed to create association. Please try again.
                            </p>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
