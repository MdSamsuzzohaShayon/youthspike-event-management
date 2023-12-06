import React from 'react';
import Link from 'next/link';

function Loader() {
  return (
    <section className="w-full h-screen flex justify-center items-center flex-col gap-3">
      <h1 className="text-2xl">Loading</h1>
      <Link href="/">Youthspike</Link>
      <div
        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
        role="status"
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
      </div>
    </section>
  );
}

export default Loader;
