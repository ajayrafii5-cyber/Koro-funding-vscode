import { logger } from './logger.js';

// Placeholder — akan diisi setelah cTrader KYC approved
export async function disablePlatformAccount(platformLogin, platform) {
  logger.warn(`[MOCK] Disabling account ${platformLogin} on ${platform}`);
  // TODO: connect ke cTrader Open API setelah status Active
  return true;
}

export async function createPlatformAccount({ size, type, phase }) {
  logger.warn(`[MOCK] Creating account size=${size} type=${type} phase=${phase}`);
  return {
    login:    `KF-${Math.floor(10000 + Math.random() * 90000)}`,
    password: Math.random().toString(36).slice(2, 10),
    server:   'KoroFunding-Demo'
  };
}
