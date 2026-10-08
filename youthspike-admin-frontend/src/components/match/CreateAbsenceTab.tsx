import { useCallback, useEffect, useState } from "react";
import InputField from "../elements/forms/InputField";
import { IBulkAbsenceMatchDialogProps, ITeam } from "@/types";

// ===================== Create Absence Tab =====================
interface CreateAbsenceTabProps {
    selectedTeam: ITeam | null;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    onSubmit: IBulkAbsenceMatchDialogProps['onSubmit'];
    onClose: () => void;
}

const inputClassName =
    'w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-yellow-500';
const textareaClassName = `${inputClassName} resize-none`;

function CreateAbsenceTab({
    selectedTeam,
    dialogRef,
    onSubmit,
    onClose,
}: CreateAbsenceTabProps) {
    const [count, setCount] = useState<number>(1);
    const [reason, setReason] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const resetForm = useCallback(() => {
        setCount(1);
        setReason('');
        setNotes('');
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleDialogClose = () => resetForm();
        dialog.addEventListener('close', handleDialogClose);
        return () => dialog.removeEventListener('close', handleDialogClose);
    }, [dialogRef, resetForm]);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (count < 1) {
            console.error('At least one match is required.');
            return;
        }
        if (!selectedTeam?._id) {
            console.error('Please select a team first.');
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                team: selectedTeam._id,
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

    const handleCancel = (e: React.SyntheticEvent) => {
        e.preventDefault();
        onClose();
    };

    const isSubmitDisabled = isSubmitting || !selectedTeam?._id || count < 1;
    const submitLabel = isSubmitting
        ? 'Saving...'
        : `Create ${count} Absence${count > 1 ? 's' : ''}`;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-4 flex flex-col gap-4">
                <h4> {selectedTeam?.name ?? 'No team selected'}</h4>
                <InputField name="count" type="number" onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))} required label="Number of Absences" />
                <InputField name="reason" type="textarea" onChange={(e) => setReason(e.target.value)}  />
                <InputField name="notes" type="textarea" onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
                <button type="button" onClick={handleCancel} className="btn-danger">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitDisabled} className="btn-info">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

export default CreateAbsenceTab;
