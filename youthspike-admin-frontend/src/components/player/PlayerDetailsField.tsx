
// ---------------------------------------------------------------------------
// PlayerDetailsFields — name/username/password/email/phone grid.
// ---------------------------------------------------------------------------

import { TAddPlayer, TUpdatePlayer } from "@/types";
import InputField from "../elements/forms/InputField";

interface PlayerDetailsFieldsProps {
    isUpdateMode: boolean;
    playerState: TAddPlayer;
    playerUpdate: Partial<TUpdatePlayer>;
    canEditPassword: boolean;
    onFieldChange: (e: React.SyntheticEvent) => void;
}

const PlayerDetailsFields: React.FC<PlayerDetailsFieldsProps> = ({
    isUpdateMode,
    playerState,
    playerUpdate,
    canEditPassword,
    onFieldChange,
}) => (
    <div className="part-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <InputField
            type="text"
            name="firstName"
            label="First Name"
            defaultValue={playerState.firstName}
            onChange={onFieldChange}
            required={!isUpdateMode}
        />
        <InputField
            type="text"
            name="lastName"
            label="Last Name"
            defaultValue={playerState.lastName}
            onChange={onFieldChange}
            required={!isUpdateMode}
        />
        {isUpdateMode && (
            <InputField type="text" name="username" defaultValue={playerState.username} onChange={onFieldChange} required={false} />
        )}
        {canEditPassword && (
            <>
                <InputField type="password" name="password" defaultValue={playerUpdate.password} onChange={onFieldChange} required={false} />
                <InputField
                    type="password"
                    name="confirmPassword"
                    label="Confirm Password"
                    defaultValue={playerUpdate.confirmPassword}
                    onChange={onFieldChange}
                    required={false}
                />
            </>
        )}
        <InputField type="email" name="email" defaultValue={playerState.email} onChange={onFieldChange} required={false} />
        <InputField type="number" name="phone" defaultValue={playerState.phone} onChange={onFieldChange} />
    </div>
);


export default PlayerDetailsFields;
