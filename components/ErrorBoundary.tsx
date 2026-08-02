import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lexicon AI render crash:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = window.location.origin;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-surface border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
            <h1 className="text-xl font-bold font-display text-text mb-2">Something went wrong</h1>
            <p className="text-sm text-muted mb-6">
              Lexicon hit an unexpected error. Your data is safe — reload to continue.
            </p>
            <button
              onClick={this.handleReload}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
