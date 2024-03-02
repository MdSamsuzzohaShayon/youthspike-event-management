import { CSSProperties } from "react";
import { netSize, screen } from "./constant";

const border = {
    dark: 'border-gray-700',
    light: 'border-gray-300',
};

// Match style
const textStyle = (screenWidth: number): CSSProperties => ({ fontSize: screenWidth > screen.xs ? `${netSize.fsl}rem` : `${netSize.fsm}rem` });
const headingStyle = (screenWidth: number, h1: number = 0, h2: number = 0): CSSProperties => ({ fontSize: screenWidth > screen.xs ? `${netSize.hfl + h1 + h2}rem` : `${netSize.hfm + h1 + h2}rem` });


export { border, textStyle, headingStyle };