import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary]', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-sm">
            <h2 className="text-base font-black text-[var(--color-text-strong)] mb-2">Something went wrong rendering this view</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">A runtime error occurred. Try reloading or navigating again.</p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}