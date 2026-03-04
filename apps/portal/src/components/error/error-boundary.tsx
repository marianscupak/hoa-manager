import { Component, ErrorInfo, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} />;
        }

        return this.props.children;
    }
}

function ErrorFallback({ error }: { error?: Error }) {
    const { t } = useTranslation("common");

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h1 className="text-destructive mb-4 text-3xl font-bold">
                {t("error.title", "Something went wrong")}
            </h1>
            <p className="text-muted-foreground mb-8">
                {t("error.description", "An unexpected error occurred.")}
            </p>
            {error && (
                <pre className="bg-muted text-destructive mt-4 max-w-2xl overflow-auto rounded p-4 text-left text-sm">
                    {error.message}
                </pre>
            )}
            <button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90 mt-8 rounded px-4 py-2 font-medium text-white"
            >
                {t("error.reload", "Reload page")}
            </button>
        </div>
    );
}
