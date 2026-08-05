import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logError } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  correlationId: string | null;
}

/** Top-level error boundary. Catches render errors and shows a recovery UI. */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, correlationId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      correlationId: `ui_${Date.now().toString(36)}`,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error, {
      componentStack: info.componentStack,
      correlationId: this.state.correlationId,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, correlationId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-brand-onyx">
          <div className="max-w-md glass-card p-8 text-center animate-fade-in">
            <AlertTriangle className="w-10 h-10 text-brand-coral mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-brand-silver mb-2">
              Something went wrong
            </h2>
            <p className="text-xs font-mono text-brand-ash mb-4 leading-relaxed">
              {this.state.error?.message ?? 'An unexpected rendering error occurred.'}
            </p>
            {this.state.correlationId && (
              <p className="text-[9px] font-mono text-brand-ash/40 mb-6">
                ID: {this.state.correlationId}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-glass-border text-xs font-mono text-brand-ash hover:text-brand-silver hover:border-brand-blue/30 transition-smooth mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
