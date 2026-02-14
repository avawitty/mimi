
// @ts-nocheck
import React, { Component, ReactNode, StrictMode, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');

// ENTRY VERIFICATION
console.log("MIMI ROOT v4.4 DETECTED");

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
          color: '#1C1917',
          fontFamily: 'serif'
        }}>
          <h1 style={{ fontStyle: 'italic', fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'normal', color: '#1C1917' }}>Mimi crashed.</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', maxWidth: '300px', lineHeight: '1.4', color: '#1C1917' }}>The aesthetic frequency was too dense for this browser resolution.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '3rem', 
              padding: '1.2rem 3rem', 
              border: '1px solid #1C1917', 
              background: '#1C1917', 
              color: '#FDFBF7',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '10px',
              letterSpacing: '0.4em',
              fontWeight: '900',
              borderRadius: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
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

const MimiSplash: React.FC = () => {
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const check = setInterval(() => {
      if (document.body.classList.contains('hydrated')) {
        setFading(true);
        clearInterval(check);
        setTimeout(() => setRemoved(true), 800);
      }
    }, 100);
    return () => clearInterval(check);
  }, []);

  if (removed) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FDFBF7',
      zIndex: 100000,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.8s ease',
      pointerEvents: 'none'
    }}>
      <h1 style={{
        fontSize: '3rem',
        fontStyle: 'italic',
        letterSpacing: '-0.05em',
        color: '#1C1917',
        animation: 'pulse 2s infinite ease-in-out'
      }}>Mimi.</h1>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

const startApp = () => {
  if (!rootElement) return;
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <MimiSplash />
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
