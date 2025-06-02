'use client'

import Image from 'next/image';
import React from 'react';

function ServerReceiver() {
    /**
     * Once I set server, receiver, receiver partner and server partner will be set automitically
     */
  return (
    <div>
      <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400">Select Server/Receiver</h3>
      <div className="w-full flex flex-col lg:flex-row justify-center items-center gap-6">
        {/* Left Side */}
        <div className="w-full lg:w-1/3 flex flex-col items-center gap-4">
          <Image alt="Player" src="/imgs/player.png" width={100} height={100} className="w-32 h-32 object-cover rounded-xl border-4 border-yellow-400" />
          <div className="h-24 w-24 bg-white text-black flex items-center justify-center rounded-xl shadow-md">{/* Placeholder for player avatar or info */}</div>
          <h3 className="text-center uppercase text-yellow-400 font-semibold">
            Serving <br /> Partner
          </h3>
          <Image alt="Player" src="/imgs/player.png" width={100} height={100} className="w-32 h-32 object-cover rounded-xl border-4 border-yellow-400" />
        </div>

        {/* Middle Side */}
        <div className="w-full lg:w-1/3 flex justify-center items-center">
          <div className="w-4/6 md:w-2/6 flex flex-col items-center gap-6 bg-white text-black rounded-xl p-6 shadow-lg">
            <Image alt="Logo" src="/imgs/spikeball-logo.webp" width={40} height={40} className="mb-2" />

            <div className="bg-black h-24 w-24 flex items-center justify-center rounded-xl border-4 border-yellow-400">
              <Image alt="Add Server" src="/icons/plus.svg" width={50} height={50} className="invert" />
            </div>
            <h3 className="uppercase text-center font-semibold text-yellow-400">Server</h3>

            <div className="flex justify-center items-center py-2">
              <Image alt="Net" src="/imgs/spikeball-net.png" width={80} height={80} />
            </div>

            <div className="bg-black h-24 w-24 flex items-center justify-center rounded-xl border-4 border-yellow-400">
              <Image alt="Add Receiver" src="/icons/plus.svg" width={50} height={50} className="invert" />
            </div>
            <h3 className="uppercase text-center font-semibold text-yellow-400">Receiver</h3>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/3 flex flex-col items-center gap-4">
          <Image alt="Player" src="/imgs/player.png" width={100} height={100} className="w-32 h-32 object-cover rounded-xl border-4 border-yellow-400" />
          <div className="h-24 w-24 bg-white text-black flex items-center justify-center rounded-xl shadow-md">{/* Placeholder for player avatar or info */}</div>
          <h3 className="text-center uppercase text-yellow-400 font-semibold">
            Receiving <br /> Partner
          </h3>
          <Image alt="Player" src="/imgs/player.png" width={100} height={100} className="w-32 h-32 object-cover rounded-xl border-4 border-yellow-400" />
        </div>
      </div>
    </div>
  );
}

export default ServerReceiver;
