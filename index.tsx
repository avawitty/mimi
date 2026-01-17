
import React, { Component, ReactNode, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Catch unhandled domain/promise rejections that cause White Screens on mobile
window.addEventListener('unhandledrejection', (event) => {
  console.warn("MIMI // Unhandled Handshake Rejection:", event.reason);
  // Prevent the crash from freezing the UI
  event.preventDefault();
});

/**
 * RootErrorBoundary: Safeguards the application from structural UI failures.
 */
// Fix: Explicitly pass Props and State to the Component base class to ensure 'this.state' and 'this.props' are defined.
class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Initialize state properly
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: Error): State { 
    return { hasError: true, error }; 
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("MIMI // Structural Failure:", error, info);
  }

  render(): ReactNode {
    // Fix: Using the properly initialized and typed state
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-12 bg-[#FDFBF7] text-[#1C1917] font-serif">
          <h1 className="text-4xl italic mb-4">Structural Collapse.</h1>
          <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-stone-400 mb-12">The signal has been reclaimed by entropy.</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }} 
              className="px-12 py-4 border border-stone-200 font-sans text-[10px] uppercase tracking-[0.6em] hover:bg-black hover:text-white transition-all"
            >
              Purge & Re-Sync
            </button>
          </div>
        </div>
      );
    }
    
    // Fix: Using the properly initialized and typed props
    return this.props.children;
  }
}

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>
  );
}
