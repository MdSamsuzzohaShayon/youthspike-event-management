import { EEventPeriod } from '@/types/event';

const screen = {
  xs: 500,
};

const netSize = {
  // Height
  mhl: 27,
  mhm: 32,

  // Font seizes
  fsl: 0.4, // large screen
  fsm: 0.6, // small scrteen
  hfl: 0.6,
  hfm: 1,

  tlh: 3.5, // team logo height = 2rem
};

// Net Card
const EXTRA_HEIGHT: number = 120;

// Local Storage Names
const MUSIC_TIME_PASSED = 'MUSIC_TIME_PASSED';
const MATCHES_LS = 'MATCHES_LS';

const imgW = {
  logo: 20,
  xs: 200,
  sm: 576,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

const eventPeriods = [EEventPeriod.CURRENT, EEventPeriod.PAST];

const APP_NAME = 'YouthSpike';
const EVENT_ITEM = 'event_item'; // Name of the query params
const LDO_ID = 'ldoId';
const ACCESS_CODE = 'access_code';

// eslint-disable-next-line import/prefer-default-export
export { screen, netSize, EXTRA_HEIGHT, MUSIC_TIME_PASSED, MATCHES_LS, imgW, eventPeriods, EVENT_ITEM, LDO_ID, APP_NAME, ACCESS_CODE };
