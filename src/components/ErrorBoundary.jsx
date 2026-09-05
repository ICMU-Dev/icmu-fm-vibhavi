import React from 'react';
import { FallbackStatusPage } from '../pages/NotFoundPage';

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
                <FallbackStatusPage 
                    code="500"
                    title="Something Went Wrong"
                    subtitle="System Exception • Console Error"
                    description="An unexpected error occurred in the broadcast studio application."
                    variant="amber"
                    extraDetails={this.state.error?.toString()}
                />
            );
        }

        return this.props.children;
    }
}
