import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // If the error is related to failing to fetch a dynamically imported module,
    // we can attempt a hard reload.
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed')
    ) {
      // Use sessionStorage to prevent infinite reload loops
      const reloaded = sessionStorage.getItem('chunk_failed_reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk_failed_reload', 'true');
        window.location.reload();
      } else {
        sessionStorage.removeItem('chunk_failed_reload');
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">A new version might be available. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
