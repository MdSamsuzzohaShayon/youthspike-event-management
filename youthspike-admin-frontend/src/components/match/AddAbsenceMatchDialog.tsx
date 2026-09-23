import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_MATCHES } from '@/graphql/matches'; // adjust path if needed
import { ITeam } from '@/types';

interface IAddAbsenceMatchDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  selectedTeam: ITeam | null;
  eventId: string;
  onClose: () => void;
  onSubmit: (input: {
    team: string;
    match?: string | null;
    reason?: string;
    notes?: string;
  }) => Promise<void> | void;
}

function AddAbsenceMatchDialog({
  dialogRef,
  selectedTeam,
  eventId,
  onClose,
  onSubmit,
}: IAddAbsenceMatchDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchMatches, { data, loading }] = useLazyQuery(SEARCH_MATCHES);

  // Debounced search by description/location
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchMatches({
        variables: {
          filter: { search: search.trim() || undefined, limit: 30 },
          eventId,
        },
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, eventId, searchMatches]);

  // Reset internal state when dialog closes
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      setSearch('');
      setSelectedMatchId(null);
      setReason('');
      setNotes('');
    };

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [dialogRef]);

  // @ts-ignore
  const matches = useMemo(() => data?.searchMatches?.data?.matches ?? [], [data]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        team: selectedTeam._id,
        match: selectedMatchId || undefined,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      dialogRef.current?.close();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
    >
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Absence Match</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Team — pre-selected, read-only */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">Team</label>
            <input
              type="text"
              value={selectedTeam?.name ?? ''}
              readOnly
              className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white"
            />
          </div>

          {/* Match search (optional) */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">
              Match (optional)
            </label>
            <input
              type="text"
              placeholder="Search by description or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white"
            />

            {loading && (
              <p className="text-xs text-gray-400 mt-1">Searching...</p>
            )}

            {!loading && search.trim() && matches.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No matches found.</p>
            )}

            {matches.length > 0 && (
              <ul className="mt-2 max-h-48 overflow-y-auto border border-gray-600 rounded-md">
                {matches.map((m: any) => {
                  const isSelected = selectedMatchId === m._id;
                  return (
                    <li
                      key={m._id}
                      role="presentation"
                      onClick={() => setSelectedMatchId(isSelected ? null : m._id)}
                      className={`px-3 py-2 cursor-pointer text-sm flex justify-between items-center ${
                        isSelected
                          ? 'bg-yellow-logo text-black'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium">
                          {m.description || '(No description)'}
                        </div>
                        <div className="text-xs opacity-75">
                          {m.location || '—'} {m.date ? `• ${m.date}` : ''}
                        </div>
                      </div>
                      {isSelected && <span>✓</span>}
                    </li>
                  );
                })}
              </ul>
            )}

            {selectedMatchId && (
              <button
                type="button"
                onClick={() => setSelectedMatchId(null)}
                className="text-xs text-yellow-400 mt-1 hover:underline"
              >
                Clear selected match
              </button>
            )}
          </div>

          {/* Reason (optional) */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 text-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-yellow-logo text-black hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default AddAbsenceMatchDialog;