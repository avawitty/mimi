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

class RootErrorBoundary extends Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State { 
    return { hasError: true, error }; 
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("MIMI // Structural Failure:", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          width: '100vw', 
          backgroundColor: '#FDFBF7', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'serif'
        }}>
          <h1 style={{ fontStyle: 'italic', fontSize: '2.5rem', marginBottom: '1rem' }}>Mimi crashed.</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', maxWidth: '300px' }}>The aesthetic frequency was too dense for this browser.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '2rem', 
              padding: '1rem 2rem', 
              border: '1px solid #1C1917', 
              background: 'none', 
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '10px',
              letterSpacing: '0.3em',
              fontWeight: 'bold'
            }}
          >
            Attempt Restoration
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

const startApp = () => {
  if (!rootElement) return;
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>
  );
};

// Immediate manifestation
try {
  startApp();
} catch (err) {
  console.error("MIMI // Fatal Manifestation Failure:", err);
}