import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { IBulkAbsenceMatchDialogProps, ITeam } from '@/types';
import TabButton from './TabButton';
import CreateAbsenceTab from './CreateAbsenceTab';
import AbsenceListTab from './AbsenceListTab';
import GroupPointsTab from './GroupPointsTab';


type TabType = 'create-absence' | 'absence-list' | 'group-points';

interface ITabConfig {
  id: TabType;
  label: string;
}




// ===================== Constants =====================
const TAB_CONFIGS: ITabConfig[] = [
  { id: 'create-absence', label: 'Create Absence' },
  { id: 'absence-list', label: 'Absence List' },
  { id: 'group-points', label: 'Group Points' },
];

const DEFAULT_TAB: TabType = 'create-absence';



function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-8 text-center">
      <p className="text-red-400 text-sm mb-2">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-yellow-500 hover:underline text-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}




// ===================== Main Dialog Component =====================
function BulkAbsenceMatchDialog({
  dialogRef,
  selectedTeam,
  onClose,
  onSubmit,
}: IBulkAbsenceMatchDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>(DEFAULT_TAB);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleDialogClose = () => setActiveTab(DEFAULT_TAB);
    dialog.addEventListener('close', handleDialogClose);
    return () => dialog.removeEventListener('close', handleDialogClose);
  }, [dialogRef]);

  const handleClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  const teamId = selectedTeam?._id ?? '';
  const isTeamSelected = Boolean(teamId);

  const renderTabContent = () => {
    if (activeTab === 'create-absence') {
      return (
        <CreateAbsenceTab
          selectedTeam={selectedTeam}
          dialogRef={dialogRef}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      );
    }

    if (activeTab === 'absence-list') {
      if (!isTeamSelected) {
        return <ErrorState message="Please select a team first." />;
      }
      return <AbsenceListTab teamId={teamId} />;
    }

    if (activeTab === 'group-points') {
      return <GroupPointsTab selectedTeam={selectedTeam} />;
    }

    return null;
  };

  return (
    <dialog ref={dialogRef} className="modal-dialog">
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">
            Manage Team Absences &amp; Points
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700"
            aria-label="Close"
          >
            <Image
              src="/icons/close.svg"
              alt="Close"
              width={16}
              height={16}
              className="svg-white"
            />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {TAB_CONFIGS.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto">{renderTabContent()}</div>
      </div>
    </dialog>
  );
}

export default BulkAbsenceMatchDialog;