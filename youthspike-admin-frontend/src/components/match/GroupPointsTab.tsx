import { CREATE_GROUP_POINTS, GET_GROUP_POINTS, UPDATE_GROUP_POINTS, UPDATED_GROUP_POINTS_FRAGMENT } from "@/graphql/group";
import { GetTeamMatchAbsencesQuery, IGetGroupPointsQuery, IGroupPointsResponse, IResponse, ITeam, TGroupPointsAdd } from "@/types";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import InputField from "../elements/forms/InputField";
import { useParams } from "next/navigation";

// ===================== Group Points Tab =====================
interface GroupPointsTabProps {
    selectedTeam: ITeam | null;
}

interface GroupPointsForm {
    groupPointsId: string;
    fetchIdInput: string;
    event: string;
    points: number;
    notes: string;
}


const EMPTY_GROUP_POINTS_FORM: GroupPointsForm = {
    groupPointsId: '',
    fetchIdInput: '',
    event: '',
    points: 0,
    notes: '',
};

export function GroupPointsTab({ selectedTeam }: GroupPointsTabProps) {
    const params = useParams<{ eventId: string; }>()

    const [form, setForm] = useState<GroupPointsForm>({ ...EMPTY_GROUP_POINTS_FORM });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const mode: 'create' | 'update' = form.groupPointsId ? 'update' : 'create';


    const {
        loading,
        error,
        data,
        refetch,
    } = useQuery<IGetGroupPointsQuery>(
        GET_GROUP_POINTS,
        {
            variables: { teamId: selectedTeam?._id || "" },
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-first',
            notifyOnNetworkStatusChange: true,
        }
    );

    const [createGroupPoints] = useMutation<{ createGroupPoints: IGroupPointsResponse }>(CREATE_GROUP_POINTS, {
        update(cache, { data: mutationData }) {
            if (!mutationData?.createGroupPoints?.success || !mutationData.createGroupPoints.data) return;
            const created = mutationData.createGroupPoints.data;
            cache.writeQuery({
                query: GET_GROUP_POINTS,
                variables: { groupPointsId: created._id },
                data: { getGroupPoints: mutationData.createGroupPoints },
            });
        },
    });

    const [updateGroupPoints] = useMutation<{ updateGroupPoints: IGroupPointsResponse }>(UPDATE_GROUP_POINTS, {
        update(cache, { data: mutationData }) {
            if (!mutationData?.updateGroupPoints?.success || !mutationData.updateGroupPoints.data) return;
            const updated = mutationData.updateGroupPoints.data;
            cache.writeFragment({
                id: cache.identify({
                    __typename: 'GroupPoints',
                    _id: updated._id,
                }),
                fragment: UPDATED_GROUP_POINTS_FRAGMENT,
                data: {
                    __typename: 'GroupPoints',
                    ...updated,
                },
            });
        },
    });

    const handleFormChange = useCallback(
        (field: keyof GroupPointsForm, value: string | number) => {
            setForm((prev) => ({ ...prev, [field]: value }));
        },
        []
    );


    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!selectedTeam?._id) {
            console.error('Team is required.');
            return;
        }

        if (!params.eventId) {
            console.error('Event Id is required.');
            return;
        }


        const eventId = params.eventId;
        const trimmedNotes = form?.notes.trim() || undefined;
        const pointsValue = Number(form.points);

        try {
            setIsSubmitting(true);

            const input = {
                team: selectedTeam._id,
                event: eventId,
                points: pointsValue,
                notes: trimmedNotes,

            } as TGroupPointsAdd;

            if (mode === 'create') {
                const { data: mutationData } = await createGroupPoints({
                    variables: {
                        input,
                    },
                });

                const created = mutationData?.createGroupPoints?.data;
                if (mutationData?.createGroupPoints?.success && created) {
                    setForm((prev) => ({
                        ...prev,
                        groupPointsId: created._id,
                    }));
                }
            } else {
                await updateGroupPoints({
                    variables: {
                        updateInput: {
                            _id: form.groupPointsId,
                            team: selectedTeam._id,
                            event: eventId,
                            points: pointsValue,
                            notes: trimmedNotes,
                        },
                    },
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetForm = useCallback(() => {
        setForm({ ...EMPTY_GROUP_POINTS_FORM });
        setFetchError(null);
    }, []);

    useEffect(() => {
        if (data?.getGroupPoints?.data) {
            const fetchedData = data.getGroupPoints.data;
            setForm((prevState) => ({
                ...prevState,
                notes: fetchedData.notes || "",
                points: fetchedData.points || 0,
                event: params.eventId
            }))
        }
    }, [data, params]);

    const isSubmitDisabled = isSubmitting || !selectedTeam?._id;

    const submitLabel = isSubmitting
        ? 'Saving...'
        : mode === 'create'
            ? 'Create Group Points'
            : 'Update Group Points';

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-4 flex flex-col gap-4">
                {mode === 'update' ? (
                    <div className="flex items-center justify-between gap-2 p-3 bg-gray-800 rounded-md text-sm text-gray-300">
                        <div className="flex flex-col min-w-0">
                            <span className="text-gray-400 text-xs">Editing Group Points ID:</span>
                            <span className="font-mono text-yellow-500 text-xs truncate" title={form.groupPointsId}>
                                {form.groupPointsId}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetForm}
                            className="ml-2 text-xs text-blue-400 hover:underline whitespace-nowrap"
                        >
                            Create New
                        </button>
                    </div>
                ) : (
                    <div>
                        <h2>Team</h2>
                    </div>
                )}

                <h4>{selectedTeam?.name ?? 'No team selected'}</h4>

                <InputField name="points" required type="number" onChange={(e) => handleFormChange('points', Number(e.target.value) || 0)} value={String(form.points)} />
                <InputField name="notes" type="textarea" onChange={(e) => handleFormChange('notes', e.target.value)} value={form.notes} />
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
                <button type="submit" disabled={isSubmitDisabled} className="btn-info">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}


export default GroupPointsTab;