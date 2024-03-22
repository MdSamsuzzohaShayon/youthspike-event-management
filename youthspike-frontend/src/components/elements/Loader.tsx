import React from 'react';

function Loader() {
  return (
    <div className="spinner-container flex justify-center items-center h-screen">
      <div className="spinner border-l border-top border-yellow-400 h-20 w-20 rounded-full"></div>
    </div>
  )
}

export default Loader;