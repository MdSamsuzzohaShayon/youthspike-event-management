import { UPDATE_MATCH } from "@/graphql/matches";
import { useMutation, ApolloError } from "@apollo/client";
import React from "react";
import { useAppDispatch } from "@/redux/hooks";
import { EMessage, IMatchExpRel, IMatchRelatives } from "@/types";
import { setMessage } from "@/redux/slices/elementSlice";
import { useRouter } from "next/navigation";

interface IConfirmCompleteDialogProps {
  completeDialogEl: React.RefObject<HTMLDialogElement | null>;
  matchId: string;
  match: IMatchRelatives;
}

function ConfirmCompleteDialog({
  completeDialogEl,
  matchId,
  match,
}: IConfirmCompleteDialogProps) {
  const dispatch = useAppDispatch();
  const [mutateMatch, { loading }] = useMutation(UPDATE_MATCH);

  const handleConfirmComplete = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      if (loading) {
        console.log("Still loading");
        return;
      }

      const completed = match?.completed ? false : true; // Match is compled make it incomplete, if it is completed then make it completed
      const { data } = await mutateMatch({
        variables: { input: { completed }, matchId },
      });

      // ✅ Handle GraphQL response success/failure
      if (data?.updateMatch?.success) {
        completeDialogEl.current?.close();
        // router.push(`/events/${eventId}`); // ✅ Navigate to /matches
        window.location.reload();
      } else {
        alert(data?.updateMatch?.message || "Failed to complete match.");
      }
    } catch (err) {
      const error = err as ApolloError;
      console.error("Error completing match:", error);
      dispatch(setMessage({ type: EMessage.ERROR, message: String(error) }));
    }
  };

  return (
    <dialog className="modal-dialog" ref={completeDialogEl}>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold text-yellow-400">
          {match.completed ? "Undo completed match!" : "Complete match"}
        </h2>
        <p className="text-sm text-gray-300">
          ⚠️ Warning:{" "}
          {match.completed
            ? "You can undo completed match if you had a few hounds left to complete!"
            : "Make sure you are okay with completing match without completing all next rounds."}
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <button
            className="bg-yellow-logo hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium transition duration-200 disabled:opacity-50"
            onClick={handleConfirmComplete}
            disabled={loading}
          >
            {loading ? "Completing..." : "Confirm"}
          </button>
          <button
            className="bg-transparent border border-yellow-logo text-yellow-400 hover:bg-yellow-600 hover:text-white px-4 py-2 rounded-md transition duration-200"
            onClick={() => completeDialogEl.current?.close()}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmCompleteDialog;
