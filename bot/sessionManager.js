// bot/sessionManager.js
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');

function getUserAuthDir(number) {
  return path.join('auth_info', `user-${number}`);
}

async function createUserSession(number, onPairingCode, onSessionReady) {
  const authDir = getUserAuthDir(number);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
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