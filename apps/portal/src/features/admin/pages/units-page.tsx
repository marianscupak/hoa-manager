export function UnitsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Units & Owners
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Manage the units in your community and their respective
                    owners.
                </p>
            </div>

            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500">
                    No units have been added yet
                </p>
            </div>
        </div>
    );
}
