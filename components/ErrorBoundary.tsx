import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
 children?: ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
 errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
 public state: State = {
 hasError: false,
 error: null,
 errorInfo: null
 };

 public static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error, errorInfo: null };
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error('Uncaught error:', error, errorInfo);
 this.setState({ errorInfo });
 }

 public render() {
 if (this.state.hasError) {
 let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
 let isFirestoreError = false;

 try {
 const parsed = JSON.parse(errorMessage);
 if (parsed.error && parsed.operationType) {
 isFirestoreError = true;
 errorMessage = parsed.error;
 }
 } catch (e) {
 // Not a JSON error message
 }

 return (
 <div className="min-h-screen bg text-nous-text flex flex-col items-center justify-center p-6 font-sans">
 <div className="max-w-md w-full bg-nous-base/50 backdrop-blur-md border border-nous-border rounded-none p-8 text-center space-y-6">
 <div className="w-16 h-16 bg-red-500/10 rounded-none flex items-center justify-center mx-auto">
 <AlertTriangle className="w-8 h-8 text-red-500"/>
 </div>
 
 <div className="space-y-2">
 <h1 className="text-xl font-serif italic text-white">Something went wrong</h1>
 <p className="text-sm text-nous-subtle">
 {isFirestoreError 
 ?"We encountered a database permissions issue. If you recently updated your app, please ensure your Firestore Security Rules are deployed."
 :"The application encountered an unexpected error."}
 </p>
 </div>

 <div className="bg-black/50 rounded-none p-4 text-left overflow-auto max-h-48 border border-nous-border">
 <p className="text-xs font-mono text-red-400 break-words">
 {errorMessage}
 </p>
 </div>

 <button
 onClick={() => window.location.reload()}
 className="w-full py-3 bg-nous-base text-nous-text rounded-none font-medium hover:bg-stone-200 transition-colors"
 >
 Reload Application
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
