
// ---------------------------------------------------------------------------
// EventAndDivisionSelectors — the two selects shown only when creating.
// ---------------------------------------------------------------------------

import { IEvent, IOption } from "@/types";
import { divisionsToOptionList } from "@/utils/helper";
import SelectInput from "../elements/forms/SelectInput";
import { toSelectOptions } from "@/utils/player/add-player";

interface EventAndDivisionSelectorsProps {
    events: IEvent[] | undefined | null;
    selectedEventId: string | null;
    divisionOptions: IOption[];
    selectedDivision: string | undefined | null;
    onEventChange: (e: React.SyntheticEvent) => void;
    onDivisionChange: (e: React.SyntheticEvent) => void;
  }
  
  const EventAndDivisionSelectors: React.FC<EventAndDivisionSelectorsProps> = ({
    events,
    selectedEventId,
    divisionOptions,
    selectedDivision,
    onEventChange,
    onDivisionChange,
  }) => (
    <>
      <SelectInput
        name="events"
        value={selectedEventId}
        optionList={toSelectOptions(events ?? [], (event) => event._id, (event) => event.name)}
        handleSelect={onEventChange}
      />
      <div className="mt-2 division-selection w-full">
        <SelectInput
          name="division"
          value={selectedDivision}
          optionList={divisionOptions}
          handleSelect={onDivisionChange}
        />
      </div>
    </>
  );

  export default EventAndDivisionSelectors;