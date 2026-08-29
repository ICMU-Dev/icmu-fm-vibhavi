import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './motion/button/base';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-dvh flex flex-col items-center justify-center bg-background text-foreground p-6 font-sans">
                    <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold mb-2 tracking-tight text-center">Something went wrong</h1>
                    <p className="text-muted-foreground text-sm max-w-md text-center mb-6">
                        An unexpected error occurred in the application.
                    </p>
                    <div className="bg-card/50 p-4 rounded-lg w-full max-w-md overflow-x-auto text-xs font-mono text-muted-foreground mb-6">
                        {this.state.error?.toString()}
                    </div>
                    <Button onClick={() => window.location.reload()} variant="default">
                        Reload Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
