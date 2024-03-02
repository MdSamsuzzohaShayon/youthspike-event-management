import { EAssignStrategies } from "@/types/elements";
import { EEventPeriod } from "@/types/event";

const assignStrategies = [EAssignStrategies.AUTO, EAssignStrategies.RANDOM, EAssignStrategies.ANCHORING];
const eventPeriods = [EEventPeriod.CURRENT, EEventPeriod.UPCOMING, EEventPeriod.PASSED,];

export { assignStrategies, eventPeriods };