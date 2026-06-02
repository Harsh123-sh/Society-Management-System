import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.error('[ErrorBoundary] Error caught:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell flex min-h-screen items-center justify-center px-4">
          <div className="auth-card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[rgb(var(--app-text-rgb))]">Something went wrong</h2>
            <p className="mt-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <details className="mt-4 text-xs text-[rgb(var(--app-text-muted-rgb))]">
              <summary className="cursor-pointer font-mono font-semibold">Error details</summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-xs">
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="auth-button auth-button--primary mt-4 w-full"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
