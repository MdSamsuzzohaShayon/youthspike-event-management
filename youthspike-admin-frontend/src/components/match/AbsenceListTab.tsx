import { UPDATED_ABSENCE_FRAGMENT } from "@/graphql/group";
import { DELETE_TEAM_MATCH_ABSENCE, SEARCH_TEAM_MATCH_ABSENCES, UPDATE_TEAM_MATCH_ABSENCE } from "@/graphql/matches";
import { GetTeamMatchAbsencesQuery, IMatchAbsence, IMatchAbsencesResponse, IResponse, UpdateTeamMatchAbsenceMutation } from "@/types";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import Loader from "../elements/Loader";
import AbsenceListItem from "./AbsenceListItem";

// ===================== Absence List Tab =====================
interface AbsenceListTabProps {
  teamId: string;
}

interface IAbsenceEditForm {
  reason: string;
  notes: string;
}



const EMPTY_EDIT_FORM: IAbsenceEditForm = { reason: '', notes: '' };

function AbsenceListTab({ teamId }: AbsenceListTabProps) {
  const {
    loading,
    error,
    data,
    refetch,
  } = useQuery<GetTeamMatchAbsencesQuery>(
    SEARCH_TEAM_MATCH_ABSENCES,
    {
      variables: { filter: {team: teamId} },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
    }
  );

  const [deleteAbsence] = useMutation<{deleteTeamMatchAbsence: IResponse}>(DELETE_TEAM_MATCH_ABSENCE);
  const [updateAbsence] = useMutation<UpdateTeamMatchAbsenceMutation>(UPDATE_TEAM_MATCH_ABSENCE);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<IAbsenceEditForm>(EMPTY_EDIT_FORM);

  const absences = (data?.searchTeamMatchAbsenses?.data ?? []) as IMatchAbsence[];

  

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteAbsence({
          variables: { id },
          update(cache, { data: mutationData }) {
            if (!mutationData?.deleteTeamMatchAbsence?.success) return;
            cache.updateQuery<GetTeamMatchAbsencesQuery>(
              {
                query: SEARCH_TEAM_MATCH_ABSENCES,
                variables: { teamId },
              },
              (existing) => {
                if (!existing?.searchTeamMatchAbsenses?.data) return existing;
                return {
                  ...existing,
                  searchTeamMatchAbsenses: {
                    ...existing.searchTeamMatchAbsenses,
                    data: existing.searchTeamMatchAbsenses.data.filter(
                      (item) => item._id !== id
                    ),
                  },
                };
              }
            );
          },
        });
      } catch (err) {
        console.error('Failed to delete absence:', err);
      }
    },
    [deleteAbsence, teamId]
  );

  const handleStartEdit = useCallback((absence: IMatchAbsence) => {
    setEditingId(absence._id);
    setEditForm({
      reason: absence.reason ?? '',
      notes: absence.notes ?? '',
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm(EMPTY_EDIT_FORM);
  }, []);

  const handleSaveEdit = useCallback(
    async (id: string) => {
      try {
        await updateAbsence({
          variables: {
            updateInput: {
              _id: id,
              team: teamId,
              reason: editForm.reason.trim() || undefined,
              notes: editForm.notes.trim() || undefined,
            },
          },
          update(cache, { data: mutationData }) {
            if (
              !mutationData?.updateTeamMatchAbsence?.success ||
              !mutationData.updateTeamMatchAbsence.data
            )
              return;
            const updated = mutationData.updateTeamMatchAbsence.data;
            cache.writeFragment({
              id: cache.identify({
                __typename: 'TeamMatchAbsence',
                _id: updated._id,
              }),
              fragment: UPDATED_ABSENCE_FRAGMENT,
              data: {
                __typename: 'TeamMatchAbsence',
                ...updated,
              },
            });
          },
        });
        handleCancelEdit();
      } catch (err) {
        console.error('Failed to update absence:', err);
      }
    },
    [updateAbsence, teamId, editForm, handleCancelEdit]
  );

  const handleEditFormChange = useCallback(
    (field: keyof IAbsenceEditForm, value: string) => {
      setEditForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  if (loading && absences.length === 0) {
    return <Loader />;
  }

  console.log({error});
  
  if (error) {
    // return (
    //   <Error
    //     message="Failed to load absences."
    //     onRetry={() => refetch()}
    //   />
    // );
    return  <h2>Something went wrong!</h2>
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">
        Total Absences:{' '}
        <span className="text-yellow-500 font-semibold">{absences.length}</span>
      </div>

      {absences.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          No absences found.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-700 max-h-80 overflow-y-auto">
          {absences.map((absence) => (
            <AbsenceListItem
              key={absence._id}
              absence={absence}
              isEditing={editingId === absence._id}
              editForm={editForm}
              onEditFormChange={handleEditFormChange}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}


export default AbsenceListTab;