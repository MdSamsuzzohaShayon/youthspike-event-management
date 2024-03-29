import { useState, useEffect } from 'react';

// Custom hook to get screen width and listen for changes
const useScreenWidth = () => {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        // Create a resize observer to listen for changes in screen width
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(document.body);

        // Cleanup function to disconnect the observer
        return () => {
            resizeObserver.disconnect();
        };
    }, []); // Only run once on component mount

    return screenWidth;
};

export default useScreenWidth;