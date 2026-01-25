import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * ErrorBoundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
                        <div className="text-center max-w-md">
                            <div className="mb-6">
                                <i className="fas fa-exclamation-triangle text-6xl text-red-500"></i>
                            </div>
                            <h1 className="text-2xl font-bold text-red-500 mb-4">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-slate-400 mb-6">
                                {this.state.error?.message || 'An unexpected error occurred'}
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-semibold"
                                >
                                    <i className="fas fa-redo mr-2"></i>
                                    Reload Page
                                </button>
                                <button
                                    onClick={this.handleReset}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-semibold"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
