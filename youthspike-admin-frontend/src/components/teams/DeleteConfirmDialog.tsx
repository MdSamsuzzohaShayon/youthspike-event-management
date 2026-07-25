import { ITeam } from "@/types";

interface IDeleteConfirmDialogProps {
    deleteDialogRef: React.RefObject<HTMLDialogElement | null>;
    selectedTeam: ITeam | null;
    handleDeleteTeam: (e: React.SyntheticEvent, teamId: string) => void;
}

const DeleteConfirmDialog: React.FC<IDeleteConfirmDialogProps> = ({ deleteDialogRef, selectedTeam, handleDeleteTeam }) => {
    return (
        <dialog ref={deleteDialogRef} className="modal-dialog p-4">
            <div className="flex flex-col gap-y-2">
                <h4>Delete Team</h4>
                <p className="text-yellow-100/90">Are your sure you want to delete the team?</p>
                <p>Team: {selectedTeam?.name}</p>
                <div className="buttons flex w-full justify-start gap-x-2 items-center">
                    <div className="btn-info" onClick={(e) => handleDeleteTeam(e, selectedTeam?._id || "")}>
                        Confirm
                    </div>
                    <div className="btn-danger" onClick={(e) => deleteDialogRef.current?.close()}>
                        Cancel
                    </div>
                </div>
            </div>
        </dialog>
    );
};


export default DeleteConfirmDialog;