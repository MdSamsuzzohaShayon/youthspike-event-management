import '@testing-library/jest-dom';
import { screen, render, fireEvent } from '@testing-library/react';
import Menu from '@/components/layout/Menu';

describe('Menu', () => {
    it('should render menu when menu is closed', () => {
        render(<Menu />);
        const menuIcon = screen.getByAltText('menu');
        expect(menuIcon).toBeInTheDocument();
    });

    it('should render menu content when menu is open', () => {
        render(<Menu />);
        const menuIcon = screen.getByAltText('menu');
        fireEvent.click(menuIcon);
        const menuContent = screen.getByText(/Setting/);
        expect(menuContent).toBeInTheDocument();
    });

    it('should close menu when close icon is clicked', ()=>{
        render(<Menu />);

        const menuIcon = screen.getByAltText('menu');
        fireEvent.click(menuIcon);
        const closeIcon = screen.getByAltText('close');
        fireEvent.click(closeIcon);
        const menuContent = screen.queryByText(/Setting/);
        expect(menuContent).not.toBeInTheDocument();
    });

    it('should not display menu icon when menu is open',()=>{
        render(<Menu />);
        const menuIcon = screen.getByAltText('menu');
        fireEvent.click(menuIcon);
        const menuIconClosed = screen.queryByAltText('menu');
        expect(menuIconClosed).not.toBeInTheDocument();
    });

    it('should not display menu content when menu is closed', () => {
        render(<Menu />);
        const menuContent = screen.queryByText('Setting');
        expect(menuContent).not.toBeInTheDocument();
    });
});