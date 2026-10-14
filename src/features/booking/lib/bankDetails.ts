/**
 * Cleanique official bank account details config.
 * Put in a single config constant, not repeated in components.
 */
export const CLEANIQUE_BANK_DETAILS = {
  bankName: 'PalmPay',
  accountName: 'Precious Onyekachukwu Gold',
  accountNumber: '9162192102',
} as const;

export type CleaniqueBankDetails = typeof CLEANIQUE_BANK_DETAILS;
