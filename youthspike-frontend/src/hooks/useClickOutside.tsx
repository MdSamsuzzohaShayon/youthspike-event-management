import { RefObject, useEffect } from 'react';

const useClickOutside = (elRef: RefObject<HTMLElement | null>, handleClose: () => void) => {
  const handleClickOutside = (e: MouseEvent) => {
    if (elRef.current) {
      const elementDimensions = elRef.current.getBoundingClientRect();
      if (e.clientX < elementDimensions.left || e.clientX > elementDimensions.right || e.clientY < elementDimensions.top || e.clientY > elementDimensions.bottom) {
        handleClose();
      }
    }
  };

  useEffect(() => {
    document.body.addEventListener('click', handleClickOutside);
    return () => {
      document.body.removeEventListener('click', handleClickOutside);
    };
  }, [elRef, handleClose]);
};

export default useClickOutside;
