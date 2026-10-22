import { CREATE_GROUP_POINTS, GET_GROUP_POINTS, GET_GROUPS_POINTS } from "@/graphql/group";
import { IGetGroupsPointsQuery, IGroupPointsResponse, ITeam, TGroupPointsAdd } from "@/types";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import InputField from "../elements/forms/InputField";
import { useParams } from "next/navigation";

// ===================== Types =====================
interface GroupPointsTabProps {
    selectedTeam: ITeam | null;
}

interface GroupPointsFormState {
    points: number;
    notes: string;
}

type GroupPointsEntry = NonNullable<
    NonNullable<IGetGroupsPointsQuery["getGroupsPoints"]>["data"]
>[number];

// ===================== Constants =====================
const INITIAL_FORM_STATE: GroupPointsFormState = {
    points: 0,
    notes: "",
};

// ===================== Pure Helpers =====================
const parseTimestamp = (rawCreatedAt: string): number => {
    const numericValue = Number(rawCreatedAt);
    return Number.isNaN(numericValue)
        ? new Date(rawCreatedAt).getTime()
        : new Date(numericValue).getTime();
};

const formatGroupPointsDate = (rawCreatedAt: string): string => {
    const timestamp = Number(rawCreatedAt);
    const date = Number.isNaN(timestamp)
        ? new Date(rawCreatedAt)
        : new Date(timestamp);
    return date.toLocaleString();
};

const sortByCreatedAtDescending = (
    entries: GroupPointsEntry[]
): GroupPointsEntry[] =>
    [...entries].sort(
        (first, second) =>
            parseTimestamp(second.createdAt) - parseTimestamp(first.createdAt)
    );

const buildCreateGroupPointsInput = (
    teamId: string,
    eventId: string,
    form: GroupPointsFormState
): TGroupPointsAdd => {
    const trimmedNotes = form.notes.trim();
    return {
        team: teamId,
        event: eventId,
        points: Number(form.points),
        notes: trimmedNotes || undefined,
    };
};

const resolveErrorMessage = (error: unknown, fallback: string): string =>
    error instanceof Error ? error.message : fallback;

// ===================== Sub-components =====================
interface TeamHeaderProps {
    selectedTeam: ITeam | null;
}

const TeamHeader: React.FC<TeamHeaderProps> = ({ selectedTeam }) => (
    <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Team</h2>
        <h4 className="text-sm text-gray-300">
            {selectedTeam?.name ?? "No team selected"}
        </h4>
    </div>
);

interface ErrorBannerProps {
    message: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => (
    <p className="p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded">
        {message}
    </p>
);

interface GroupPointsFormProps {
    form: GroupPointsFormState;
    isSubmitting: boolean;
    isSubmitDisabled: boolean;
    onFieldChange: (field: keyof GroupPointsFormState, value: string | number) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const GroupPointsForm: React.FC<GroupPointsFormProps> = ({
    form,
    isSubmitting,
    isSubmitDisabled,
    onFieldChange,
    onSubmit,
}) => (
    <form onSubmit={onSubmit} className="flex flex-col">
        <div className="p-4 flex flex-col gap-4">
            <InputField
                name="points"
                required
                type="number"
                onChange={(event) =>
                    onFieldChange("points", Number(event.target.value) || 0)
                }
                value={String(form.points)}
            />
            <InputField
                name="notes"
                type="textarea"
                onChange={(event) => onFieldChange("notes", event.target.value)}
                value={form.notes}
            />
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
            <button type="submit" disabled={isSubmitDisabled} className="btn-info">
                {isSubmitting ? "Creating..." : "Create Group Points"}
            </button>
        </div>
    </form>
);

interface GroupPointsHistoryListProps {
    entries: GroupPointsEntry[];
    activeEntryId: string | null;
    isLoading: boolean;
}

const GroupPointsHistoryList: React.FC<GroupPointsHistoryListProps> = ({
    entries,
    activeEntryId,
    isLoading,
}) => {
    if (isLoading && entries.length === 0) {
        return <p className="p-4 text-sm text-gray-400">Loading group points...</p>;
    }

    if (entries.length === 0) {
        return (
            <p className="p-4 text-sm text-gray-400">No group points history available.</p>
        );
    }

    return (
        <div className="history">
            <ul className="flex flex-col gap-2">
                {entries.map((entry) => {
                    const isActive = entry._id === activeEntryId;
                    return (
                        <li
                            key={entry._id}
                            className={`p-2 rounded border ${
                                isActive
                                    ? "border-green-500 bg-green-500/10 text-green-300"
                                    : "border-gray-700"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {isActive && (
                                    <span className="px-2 py-0.5 text-xs font-semibold uppercase rounded bg-green-500/20 text-green-300">
                                        Active
                                    </span>
                                )}
                                <span>{entry.points}</span>
                                <span>-</span>
                                <span>{entry.notes || ""}</span>
                                <span>-</span>
                                <span>{formatGroupPointsDate(entry.createdAt)}</span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

// ===================== Main Component =====================
export function GroupPointsTab({ selectedTeam }: GroupPointsTabProps) {
    const params = useParams<{ eventId: string }>();
    const eventId = params?.eventId ?? "";
    const teamId = selectedTeam?._id ?? "";

    const [form, setForm] = useState<GroupPointsFormState>({ ...INITIAL_FORM_STATE });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const {
        loading: isLoadingGroupPoints,
        error: groupPointsQueryError,
        data: groupPointsQueryResult,
        refetch: refetchGroupPoints,
    } = useQuery<IGetGroupsPointsQuery>(GET_GROUPS_POINTS, {
        variables: { teamId, eventId },
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
        notifyOnNetworkStatusChange: true,
        skip: !teamId || !eventId,
    });

    const [createGroupPoints] = useMutation<{
        createGroupPoints: IGroupPointsResponse;
    }>(CREATE_GROUP_POINTS, {
        update(cache, { data: mutationData }) {
            if (!mutationData?.createGroupPoints?.success) return;
            const created = mutationData.createGroupPoints.data;
            if (!created) return;
            cache.writeQuery({
                query: GET_GROUP_POINTS,
                variables: { grouppointsId: created._id },
                data: { getGroupPoints: mutationData.createGroupPoints },
            });
        },
    });

    const handleFormChange = useCallback(
        (field: keyof GroupPointsFormState, value: string | number) => {
            setForm((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const handleResetForm = useCallback(() => {
        setForm({ ...INITIAL_FORM_STATE });
        setSubmissionError(null);
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!teamId) {
            setSubmissionError("A team must be selected before submitting points.");
            return;
        }
        if (!eventId) {
            setSubmissionError("An event ID is required to submit points.");
            return;
        }

        const input = buildCreateGroupPointsInput(teamId, eventId, form);

        try {
            setIsSubmitting(true);
            setSubmissionError(null);
            await createGroupPoints({ variables: { input } });
            await refetchGroupPoints();
            handleResetForm();
        } catch (error) {
            setSubmissionError(
                resolveErrorMessage(error, "Failed to create group points.")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedGroupPointsEntries = useMemo<GroupPointsEntry[]>(() => {
        const entries = groupPointsQueryResult?.getGroupsPoints?.data ?? [];
        return sortByCreatedAtDescending(entries);
    }, [groupPointsQueryResult]);

    const activeGroupPointsId = useMemo<string | null>(
        () => sortedGroupPointsEntries[0]?._id ?? null,
        [sortedGroupPointsEntries]
    );

    const isSubmitDisabled = isSubmitting || !teamId || !eventId;

    return (
        <div className="flex flex-col gap-4">
            <TeamHeader selectedTeam={selectedTeam} />

            {submissionError && <ErrorBanner message={submissionError} />}
            {groupPointsQueryError && (
                <ErrorBanner message={groupPointsQueryError.message} />
            )}

            <GroupPointsForm
                form={form}
                isSubmitting={isSubmitting}
                isSubmitDisabled={isSubmitDisabled}
                onFieldChange={handleFormChange}
                onSubmit={handleSubmit}
            />

            <GroupPointsHistoryList
                entries={sortedGroupPointsEntries}
                activeEntryId={activeGroupPointsId}
                isLoading={isLoadingGroupPoints}
            />
        </div>
    );
}

export default GroupPointsTab;