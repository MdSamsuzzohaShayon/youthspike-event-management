import { CSSProperties } from 'react';
import { netSize, screen } from './constant';

const border = {
  dark: 'border-gray-700',
  light: 'border-gray-300',
  green: 'border-green-600',
  red: 'border-red-600',
};

// Match style
const textStyle = (screenWidth: number): CSSProperties => ({ fontSize: screenWidth > screen.xs ? `${netSize.fsl}rem` : `${netSize.fsm}rem` });
const headingStyle = (screenWidth: number, h1: number = 0, h2: number = 0): CSSProperties => ({ fontSize: screenWidth > screen.xs ? `${netSize.hfl + h1 + h2}rem` : `${netSize.hfm + h1 + h2}rem` });

const overflowNetH = 50; // rem

// Define the type for image size properties
interface IImageSize {
  height: number;
  width: number;
}

// Define the type for the imgSize object with different size options
interface IImageSizes {
  tiny: IImageSize;
  small: IImageSize;
  medium: IImageSize;
  large: IImageSize;
  extraLarge: IImageSize;
}

// Initialize the imgSize object with different sizes
const imgSize: IImageSizes = {
  tiny: {
    height: 50,
    width: 60,
  },
  small: {
    height: 100,
    width: 120,
  },
  medium: {
    height: 200,
    width: 240,
  },
  large: {
    height: 400,
    width: 480,
  },
  extraLarge: {
    height: 800,
    width: 960,
  },
};

export { border, textStyle, headingStyle, overflowNetH, imgSize };
