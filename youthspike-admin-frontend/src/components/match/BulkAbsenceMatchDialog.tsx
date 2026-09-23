import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface IBulkAbsenceMatchDialogProps {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    selectedTeamId: string | null;
    onClose: () => void;
    onSubmit: (input: {
        team: string;
        count: number;
        reason?: string;
        notes?: string;
    }) => Promise<void>;
}

function BulkAbsenceMatchDialog({
    dialogRef,
    selectedTeamId,
    onClose,
    onSubmit,
}: IBulkAbsenceMatchDialogProps) {
    const [count, setCount] = useState<number>(1);
    const [reason, setReason] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleClose = () => {
            setCount(1);
            setReason('');
            setNotes('');
        };

        dialog.addEventListener('close', handleClose);
        return () => {
            dialog.removeEventListener('close', handleClose);
        };
    }, [dialogRef]);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!selectedTeamId || count < 1) return;

        try {
            setIsSubmitting(true);
            await onSubmit({
                team: selectedTeamId,
                count,
                reason: reason.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            dialogRef.current?.close();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = (e: React.SyntheticEvent) => {
        e.preventDefault();
        onClose();
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal-dialog"
        >
            <form onSubmit={handleSubmit} className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold">Add Multiple Absences</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700"
                        aria-label="Close"
                    >
                        <Image
                            src="/icons/close.svg"
                            alt="Close"
                            width={16}
                            height={16}
                            className="svg-white"
                        />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-4">
                    {/* Team (read-only display) */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-400">Team ID</label>
                        <input
                            type="text"
                            value={selectedTeamId || ''}
                            readOnly
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Count */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-400">
                            Number of Absences <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={count}
                            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                            required
                        />
                    </div>

                    {/* Reason */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-400">
                            Reason <span className="text-gray-500">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason for absence"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                        />
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-400">
                            Notes <span className="text-gray-500">(optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes"
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn-danger"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedTeamId || count < 1}
                        className="btn-info"
                    >
                        {isSubmitting ? 'Saving...' : `Create ${count} Absence${count > 1 ? 's' : ''}`}
                    </button>
                </div>
            </form>
        </dialog>
    );
}

export default BulkAbsenceMatchDialog;