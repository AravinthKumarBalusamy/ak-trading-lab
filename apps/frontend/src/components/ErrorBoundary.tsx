import * as React from "react";
import { Button } from "@trading-lab/ui";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-50 dark:bg-red-950/10 text-red-950 dark:text-red-200">
          <div className="max-w-md w-full p-8 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-xl space-y-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              An unexpected error was encountered during rendering.
            </p>
            {this.state.error && (
              <pre className="text-left text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-40 border border-gray-200 dark:border-gray-700">
                {this.state.error.message}
              </pre>
            )}
            <Button
              variant="primary"
              className="w-full"
              onClick={this.handleReset}
            >
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
