// app/teams/[teamId]/layout.tsx
import React from "react";

interface TeamLayoutProps {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}

async function TeamLayout({ children }: TeamLayoutProps) {

  return <div className="container mx-auto px-2">{children}</div>;
}

export default TeamLayout;
