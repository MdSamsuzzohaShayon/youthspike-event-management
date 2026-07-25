import { useMemo } from "react";
import SelectInput from "../elements/forms/SelectInput";
import { IGroup } from "@/types";


// Sub-component: Change Group Dialog
interface IChangeGroupDialogProps {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    groupList: IGroup[];
    onBulkGroupChange: (e: React.SyntheticEvent) => void;
}

const ChangeGroupDialog: React.FC<IChangeGroupDialogProps> = ({
    dialogRef,
    groupList,
    onBulkGroupChange,
}) => {
    const groupOptions = useMemo(
        () =>
            groupList.map((group, index) => ({
                id: index + 1,
                value: group._id,
                text: group.name,
            })),
        [groupList]
    );

    return (
        <dialog ref={dialogRef} className="modal-dialog">
            <div className="p-4">
                <h3>Change Group</h3>
                <SelectInput name="group" optionList={groupOptions} handleSelect={onBulkGroupChange} />
            </div>
        </dialog>
    );
};


export default ChangeGroupDialog;
