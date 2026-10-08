import { IMatchAbsence } from "@/types";
import InputField from "../elements/forms/InputField";

// interface ITeamMatchAbsence {
//     _id: string;
//     __typename: 'TeamMatchAbsence';
//     team: string;
//     match?: string;
//     reason?: string;
//     notes?: string;
// }


interface IAbsenceEditForm {
    reason: string;
    notes: string;
}


// ===================== Absence List Item =====================
interface AbsenceListItemProps {
    absence: IMatchAbsence;
    isEditing: boolean;
    editForm: IAbsenceEditForm;
    onEditFormChange: (field: keyof IAbsenceEditForm, value: string) => void;
    onStartEdit: (absence: IMatchAbsence) => void;
    onCancelEdit: () => void;
    onSaveEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

function AbsenceListItem({
    absence,
    isEditing,
    editForm,
    onEditFormChange,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDelete,
}: AbsenceListItemProps) {
    const hasDetails = Boolean(absence.reason || absence.notes);

    if (isEditing) {
        return (
            <div className="p-4 flex flex-col gap-2">
                <InputField name="reason" type="text" value={editForm.reason} onChange={(e) => onEditFormChange('reason', e.target.value)} />
                <InputField name="notes" type="textarea" value={editForm.notes} onChange={(e) => onEditFormChange('notes', e.target.value)} />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onSaveEdit(absence._id)}
                        className="btn-info"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="btn-danger"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {absence.reason && (
                    <p className="text-sm text-white truncate">
                        <span className="text-gray-400">Reason:</span> {absence.reason}
                    </p>
                )}
                {absence.notes && (
                    <p className="text-xs text-gray-400 truncate">
                        <span className="text-gray-500">Notes:</span> {absence.notes}
                    </p>
                )}
                {!hasDetails && (
                    <p className="text-sm text-gray-500 italic">No details provided</p>
                )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => onStartEdit(absence)}
                    className="btn-info"
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(absence._id)}
                    className="btn-danger"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}


export default AbsenceListItem;
