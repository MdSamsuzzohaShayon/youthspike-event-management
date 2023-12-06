import React from 'react';

function PointsByRound({ dark }: { dark: boolean }) {
  /**
   * Round score and point credentials
   */
  return (
    <div className="points-by-round flex justify-between items-center w-full">
      <div className="r-box ">
        <p className="plus text-green-600 w-full text-center h-6">5+</p>
        <p className={`base-point w-full border ${dark ? 'border-gray-100' : 'border-gray-900'} p-1 text-center`}>12</p>
      </div>
      <div className="r-box ">
        <p className="plus text-green-600 w-full text-center h-6" />
        <p className={`base-point w-full border ${dark ? 'border-gray-100' : 'border-gray-900'} p-1 text-center`}>12</p>
      </div>
      <div className="r-box ">
        <p className="plus text-green-600 w-full text-center h-6" />
        <p className={`base-point w-full border ${dark ? 'border-gray-100' : 'border-gray-900'} p-1 text-center`}>12</p>
      </div>
      <div className="r-box ">
        <p className="plus text-green-600 w-full text-center h-6" />
        <p className={`base-point w-full border ${dark ? 'border-gray-100' : 'border-gray-900'} p-1 text-center`}>12</p>
      </div>
    </div>
  );
}

export default PointsByRound;
