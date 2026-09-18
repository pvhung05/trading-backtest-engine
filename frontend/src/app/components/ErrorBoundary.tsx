import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="size-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          <div className="size-12 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400 mb-3">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="text-base font-semibold mb-1">
            {this.props.fallbackTitle || 'Component Error'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
