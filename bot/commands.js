// bot/commands.js
const { createUserSession } = require('./sessionManager');
const QRCode = require('qrcode');
const fs = require('fs');

const commands = {
  async ping(sock, jid) {
    const start = Date.now();
    await sock.sendMessage(jid, { text: '💫 Pong!' });
    const latency = Date.now() - start;
    await sock.sendMessage(jid, { text: `Ping Speed: ${latency} ms` });
  },
  async logout(sock, jid, sessions, number) {
    await sock.logout();
    sessions.delete(number);
    await sock.sendMessage(jid, { text: 'Logged out and session removed.' });
  },
  async pair(sock, jid, number, sessions) {
    if (!number) return sock.sendMessage(jid, { text: 'Invalid number.' });
    if (sessions.has(number)) {
      return sock.sendMessage(jid, { text: 'Session already exists for this number. Send "logout" from your paired WhatsApp to remove.' });
    }
    await createUserSession(number, async (code, err) => {
      if (err) {
        await sock.sendMessage(jid, { text: 'Error generating pairing code: ' + err });
      } else {
        await sock.sendMessage(jid, { text: `Pairing Code for WhatsApp (${number}): ${code}\n\nIngiza code hii WhatsApp yako: Settings > Linked Devices > Link a Device > Enter Code.` });
      }
    });
    await sock.sendMessage(jid, { text: `Session setup started for ${number}. Subiri pairing code itumwe hapa.` });
  },
  // Add more commands as needed
};

module.exports = commands; 