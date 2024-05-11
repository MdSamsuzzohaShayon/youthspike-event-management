const screen = {
  xs: 500,
};

const netSize = {
  // Height
  mhl: 27,
  mhm: 32,

  // Font seizes
  fsl: 0.6, // large screen
  fsm: 0.8, // small scrteen
  hfl: 0.8,
  hfm: 1.2,

  tlh: 3.5, // team logo height = 2rem
};

// Net Card
const EXTRA_HEIGHT: number = 40;

// Local Storage Names
const MUSIC_TIME_PASSED = 'MUSIC_TIME_PASSED';
const MATCHES_LS = 'MATCHES_LS';

const imgW ={
  logo: 20,
  xs: 200,
  sm: 576,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};


// eslint-disable-next-line import/prefer-default-export
export { screen, netSize, EXTRA_HEIGHT, MUSIC_TIME_PASSED, MATCHES_LS, imgW };
