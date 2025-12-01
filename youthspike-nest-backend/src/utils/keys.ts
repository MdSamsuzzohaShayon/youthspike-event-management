export enum EEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

// export const CACHE_EXPIRE = 60 * 60; // 1 hour
export const REDIS_CACHE_EXPIRE = 60 * 60 * 24 * 7; // 7 days

export const NODE_ENV: EEnv = EEnv.DEVELOPMENT;
// export const NODE_ENV: EEnv = EEnv.PRODUCTION;
