export const imgSize = {
    logo: 20,
    xs: 200,
    sm: 576,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};
export const cardHeight = "6rem"; // rem

// Tailwind arbitrary variants for a cross-browser custom scrollbar
export const customScrollbar = `
    [scrollbar-width:thin] 
    [scrollbar-color:#FACC15_#111827]
    [&::-webkit-scrollbar]:h-2.5 
    [&::-webkit-scrollbar]:w-2.5
    [&::-webkit-scrollbar-track]:bg-gray-800/60 
    [&::-webkit-scrollbar-track]:rounded-full 
    [&::-webkit-scrollbar-track]:m-1
    [&::-webkit-scrollbar-thumb]:bg-gradient-to-b 
    [&::-webkit-scrollbar-thumb]:from-yellow-logo 
    [&::-webkit-scrollbar-thumb]:to-amber-500
    [&::-webkit-scrollbar-thumb]:rounded-full 
    [&::-webkit-scrollbar-thumb]:border-2 
    [&::-webkit-scrollbar-thumb]:border-gray-900
    [&::-webkit-scrollbar-thumb]:transition-all 
    [&::-webkit-scrollbar-thumb]:duration-300
    [&::-webkit-scrollbar-thumb]:hover:from-amber-400 
    [&::-webkit-scrollbar-thumb]:hover:to-yellow-500
  `;

