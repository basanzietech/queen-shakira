// bot/sessionManager.js
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const P = require('pino');

function getUserAuthDir(number) {
  return path.join('auth_info', `user-${number}`);
}

// Simple getMessage implementation (no store yet)
async function getMessage(key) {
  // TODO: implement real message store if needed
  return undefined;
}

// Optional: group metadata cache (future-proof)
// const NodeCache = require('node-cache');
// const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

async function createUserSession(number, onPairingCode, onSessionReady) {
  const authDir = getUserAuthDir(number);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  // const { version } = await fetchLatestBaileysVersion(); // Not recommended to fetch every time
  // Use default version from Baileys
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'info' }),
    getMessage,
    browser: Browsers.macOS('Google Chrome'), // desktop-like for pairing code
    markOnlineOnConnect: false,
    // syncFullHistory: true, // Uncomment if you want full history
    // cachedGroupMetadata: async (jid) => groupCache.get(jid), // Optional, for group send optimization
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    if ((update.connection === 'connecting' || update.qr) && onPairingCode) {
      try {
        const code = await sock.requestPairingCode(number);
        onPairingCode(code);
      } catch (e) {
        onPairingCode(null, e);
      }
    }
    if (update.qr && onPairingCode) {
      onPairingCode(update.qr);
    }
    if (update.connection === 'open' && onSessionReady) {
      onSessionReady(sock, authDir);
    }
  });
  return sock;
}

module.exports = {
  getUserAuthDir,
  createUserSession
}; 