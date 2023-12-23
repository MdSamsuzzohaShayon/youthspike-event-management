import React from 'react';

function RoundRunner() {
  return (
    <div className="w-full">
      <div className="container px-4 mx-auto my-4">
        <div className="box flex justify-between items-start bg-gray-900 text-gray-100 py-2">
          <div className="logo-1 w-1/6">
            <img src="/thirteen.svg" className="w-full px-2" alt="thirteen" />
          </div>
          <div className="text-instruction w-4/6 text-center">
            <h1>Starting Round 2</h1>
            <p>Your squad is waiting for the other squad to assign their players.</p>
          </div>
          <div className="logo-2 w-1/6">
            <img src="/thirteen.svg" className="w-full px-2" alt="thirteen" />
          </div>
        </div>
        <div className="clock bg-red-700 w-full flex justify-center">
          <p className="text-gray-100">05:00</p>
        </div>
      </div>
    </div>
  );
}

export default RoundRunner;