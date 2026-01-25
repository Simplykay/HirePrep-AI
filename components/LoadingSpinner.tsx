import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

/**
 * Reusable loading spinner component with customizable size and message
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Loading...',
    size = 'md',
    fullScreen = false,
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-12 h-12 border-4',
        lg: 'w-16 h-16 border-4',
    };

    const containerClasses = fullScreen
        ? 'min-h-screen flex items-center justify-center bg-slate-950'
        : 'flex flex-col items-center justify-center p-8';

    return (
        <div className={containerClasses}>
            <div
                className={`${sizeClasses[size]} border-slate-800 border-t-emerald-500 rounded-full animate-spin`}
            ></div>
            {message && <p className="mt-4 text-slate-400 text-sm">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
