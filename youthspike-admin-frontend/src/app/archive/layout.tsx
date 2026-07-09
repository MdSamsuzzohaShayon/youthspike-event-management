import React, { PropsWithChildren } from 'react';

function ArchiveLayout({ children }: PropsWithChildren) {
  return <div className="min-h-screen container mx-auto px-6">
    {children}
    </div>;
}

export default ArchiveLayout;
