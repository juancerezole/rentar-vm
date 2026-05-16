import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-surface dark:bg-night-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-night-card rounded-2xl shadow-card dark:shadow-dark-card border border-ink-200 dark:border-night-border p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-ink-900 dark:text-night-text mb-2">
            Algo salió mal
          </h2>
          <p className="text-sm text-ink-500 dark:text-night-muted mb-6">
            Ocurrió un error inesperado. Podés intentar recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-brand dark:bg-accent-orange hover:bg-brand-dark dark:hover:bg-accent-orange/90 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-soft"
          >
            Recargar página
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-ink-400 dark:text-night-dim cursor-pointer">Ver error (dev)</summary>
              <pre className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-auto whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
