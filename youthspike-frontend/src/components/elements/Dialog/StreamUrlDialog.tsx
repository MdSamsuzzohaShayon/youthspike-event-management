import { INetRelatives } from '@/types';
import React from 'react';

interface IStreamUrlDialogProps{
    streamUrlDialogRef: React.RefObject<HTMLDialogElement | null>; 
    handleUpdateStreamUrl: (e: React.SyntheticEvent) => void; 
    net: INetRelatives; 
    streamUrl: string | null; 
    setStreamUrl: React.Dispatch<React.SetStateAction<string>>; 
    handleClearStreamUrl: (e: React.SyntheticEvent) => void; 
    isUpdating: boolean;
}

function StreamUrlDialog({streamUrlDialogRef, handleUpdateStreamUrl, net, streamUrl, setStreamUrl, handleClearStreamUrl, isUpdating}: IStreamUrlDialogProps) {
  return (
    <dialog
    ref={streamUrlDialogRef}
    className="modal-dialog bg-gray-800 text-white p-6 rounded-lg max-w-md w-11/12 md:w-1/2 lg:w-1/3"
  >
    <form onSubmit={handleUpdateStreamUrl}>
      <h3 className="text-xl font-semibold mb-4">
        {net.streamUrl ? "Edit Stream URL" : "Add Stream URL"}
      </h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="streamUrl" className="block text-sm font-medium mb-2">
            Stream URL
          </label>
          <input
            type="url"
            id="streamUrl"
            value={streamUrl || ""}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="https://example.com/stream"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter full URL (e.g., https://youtube.com/live/abc123)
          </p>
        </div>

        <div className="flex justify-between gap-2">
          {net.streamUrl && (
            <button
              type="button"
              onClick={handleClearStreamUrl}
              className="btn-danger"
              disabled={isUpdating}
            >
              Clear URL
            </button>
          )}

          <button
            type="button"
            onClick={() => streamUrlDialogRef.current?.close()}
            className="btn-primary"
            disabled={isUpdating}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-info"
            disabled={isUpdating || !streamUrl?.trim()}
          >
            {isUpdating ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  </dialog>
  )
}

export default StreamUrlDialog