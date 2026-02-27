import { Form, FormInput } from "@hoa-mngr/ui";

import { useCreateTenant } from "../hooks/use-create-tenant";

export function CreateTenantPage() {
    const { form, handleCreateTenant, isPending, isError } = useCreateTenant();

    return (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-slate-900">
                Create a Community
            </h1>
            <p className="mb-6 text-center text-sm text-slate-500">
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
                            className="flex w-full justify-center rounded-md bg-slate-900 px-3 py-2 text-sm leading-6 font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
                        >
                            {isPending
                                ? "Creating and joining..."
                                : "Create Community"}
                        </button>
                        {isError && (
                            <p className="mt-2 text-center text-sm text-red-500">
                                Failed to create community. Please try again.
                            </p>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
