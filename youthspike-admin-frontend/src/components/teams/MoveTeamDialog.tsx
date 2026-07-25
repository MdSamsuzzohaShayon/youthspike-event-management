import { IOption, ITeam } from "@/types";
import Image from "next/image";
import SelectInput from "../elements/forms/SelectInput";


// Sub-component: Move Team Dialog
interface IMoveTeamDialogProps {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    selectedTeam: ITeam | null;
    divisionOptions: IOption[];
    groupOptions: IOption[];
    onTeamUpdateChange: (e: React.SyntheticEvent) => void;
    onMoveTeam: (e: React.SyntheticEvent) => void;
    onClose: () => void;
}



const MoveTeamDialog: React.FC<IMoveTeamDialogProps> = ({
    dialogRef,
    selectedTeam,
    divisionOptions,
    groupOptions,
    onTeamUpdateChange,
    onMoveTeam,
    onClose,
}) => {
    return (
        <dialog ref={dialogRef} className="modal-dialog">
            <div className="p-4">
                <button
                    type="button"
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={onClose}
                >
                    <Image width={20} height={20} src="/icons/close.svg" alt="close-button" className="svg-white" />
                </button>
                <h4 className="text-lg font-semibold text-white">Move Team - {selectedTeam?.name}</h4>
                <form className="flex flex-col gap-2" onSubmit={onMoveTeam}>
                    <SelectInput
                        handleSelect={onTeamUpdateChange}
                        name="division"
                        optionList={divisionOptions}
                    // defaultValue={selectedTeam?.division}
                    />
                    <SelectInput
                        name="groups"
                        optionList={groupOptions}
                        handleSelect={onTeamUpdateChange}
                    // defaultValue={typeof selectedTeam?.group === 'object' ? selectedTeam?.group?._id : selectedTeam?.group}
                    />
                    <div className="actions flex gap-x-2 w-full justify-start items-center">
                        <button className="btn-info" type="submit">
                            Move Team
                        </button>
                        <button className="btn-danger" type="button" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </dialog>
    );
};

export default MoveTeamDialog;