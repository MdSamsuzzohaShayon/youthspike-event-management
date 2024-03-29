import { useState, useEffect } from 'react';

// Custom hook to get screen width and listen for changes
const useScreenWidth = () => {
    const [screenWidth, setScreenWidth] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(document.body.clientWidth);
        };

        if (typeof window !== 'undefined') { // Check if window object is available
            // Create a resize observer to listen for changes in screen width
            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(document.body);

            // Set initial screen width
            setScreenWidth(document.body.clientWidth);

            // Cleanup function to disconnect the observer
            return () => {
                resizeObserver.disconnect();
            };
        }
    }, []); // Only run once on component mount

    return screenWidth;
};

export default useScreenWidth;