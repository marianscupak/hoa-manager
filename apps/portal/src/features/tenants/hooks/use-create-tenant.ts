import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { showApiError } from "@/api/error-utils";
import { useTenancyControllerCreateTenant } from "@/api/generated/tenancy/tenancy";
import { useTenantSwitcher } from "@/auth/use-tenant-switcher";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export type CreateTenantFormValues = z.infer<typeof formSchema>;

export function useCreateTenant() {
    const { switchTenant, isSwitching } = useTenantSwitcher();

    const form = useForm<CreateTenantFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    const createTenantMutation = useTenancyControllerCreateTenant();

    const handleCreateTenant = (values: CreateTenantFormValues) => {
        createTenantMutation.mutate(
            { data: { name: values.name } },
            {
                onSuccess: (data) => {
                    switchTenant(data.tenantId, { redirectUrl: "/" });
                },
                onError: showApiError,
            },
        );
    };

    return {
        form,
        handleCreateTenant,
        isPending: createTenantMutation.isPending || isSwitching,
        isError: createTenantMutation.isError,
    };
}
