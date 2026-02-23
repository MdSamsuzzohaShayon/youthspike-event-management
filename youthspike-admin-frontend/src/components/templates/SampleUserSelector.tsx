// ─────────────────────────────────────────────────────────────
// components/SampleUserSelector.tsx
// ─────────────────────────────────────────────────────────────
'use client';

import React from 'react';
import { ISampleUser } from '@/types';

interface Props {
  users: ISampleUser[];
  selected: ISampleUser;
  onChange: (user: ISampleUser) => void;
}

export default function SampleUserSelector({ users, selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-300 mb-1">Preview as:</label>
      <select
        value={selected.id}
        onChange={(e) => {
          const u = users.find((u) => u.id === e.target.value);
          if (u) onChange(u);
        }}
        className="p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.label}</option>
        ))}
      </select>
    </div>
  );
}