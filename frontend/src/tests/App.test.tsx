import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders recruiter dashboard heading', () => {
    render(<App />);
    const heading = screen.getByText(/Recruiter Dashboard/i);
    expect(heading).toBeInTheDocument();
});

test('renders add candidate button on dashboard', () => {
    render(<App />);
    const button = screen.getByTestId('btn-add-candidate');
    expect(button).toBeInTheDocument();
});
