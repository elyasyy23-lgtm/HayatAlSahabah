/**
 * App-wide constants.
 *
 * SHARE_URL and DONATION_WALLET are intentionally EMPTY: nothing is invented.
 * Screens must block those actions until the owner fills a verified value.
 */

export const APP_NAME_FA = 'حیات صحابه';
export const APP_NAME_EN = 'Hayat al-Sahabah';
export const APP_VERSION = '1.0.0';

export const SUPPORT_RUBIKA_ID = '@yasmajyd';
export const SUPPORT_RUBIKA_URL = 'https://rubika.ir/yasmajyd';

/** Public download page for this app — must NOT point at another app's site. */
export const SHARE_URL = '';

/** Crypto donation destination — only after the owner confirms address + purpose. */
export const DONATION_WALLET = '';
export const DONATION_NETWORK = 'USDT · TRC20';

export const shareReady = (): boolean => SHARE_URL.trim().length > 0;
export const donateReady = (): boolean => DONATION_WALLET.trim().length > 0;
