import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '../components/LoadingSpinner';

describe('LoadingSpinner', () => {
    it('should render with default message', () => {
        render(<LoadingSpinner />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
        render(<LoadingSpinner message="Please wait..." />);
        expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('should render without message when message is empty', () => {
        render(<LoadingSpinner message="" />);
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should apply fullScreen class when fullScreen prop is true', () => {
        const { container } = render(<LoadingSpinner fullScreen={true} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain('min-h-screen');
    });

    it('should render different sizes', () => {
        const { container: smallContainer } = render(<LoadingSpinner size="sm" />);
        const { container: mediumContainer } = render(<LoadingSpinner size="md" />);
        const { container: largeContainer } = render(<LoadingSpinner size="lg" />);

        const smallSpinner = smallContainer.querySelector('div > div');
        const mediumSpinner = mediumContainer.querySelector('div > div');
        const largeSpinner = largeContainer.querySelector('div > div');

        expect(smallSpinner?.className).toContain('w-6 h-6');
        expect(mediumSpinner?.className).toContain('w-12 h-12');
        expect(largeSpinner?.className).toContain('w-16 h-16');
    });
});
