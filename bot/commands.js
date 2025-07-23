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
  async statusReact(sock, jid, emoji) {
    // React to the latest status message with the given emoji
    // This is a placeholder; in practice, you may want to fetch the latest status message key
    await sock.sendMessage('status@broadcast', { react: { text: emoji, key: { remoteJid: 'status@broadcast', id: '', fromMe: false } } });
  },
  async broadcastStory(sock, jid, { imageUrl, caption, statusJidList, backgroundColor, font }) {
    // Send a story/broadcast to statusJidList
    await sock.sendMessage(
      jid,
      {
        image: { url: imageUrl },
        caption: caption
      },
      {
        backgroundColor: backgroundColor || undefined,
        font: font || undefined,
        statusJidList: statusJidList || ['status@broadcast'],
        broadcast: true
      }
    );
  },
  async menu(sock, jid) {
    const helpText = `*Queen Shakira Bot Commands:*

• .ping - Test bot speed
• .pair <number> - Pair WhatsApp session
• .owner - Get owner contact
• .menu - Show this menu

*Special:*
• Bot will auto view & react to status
• Bot will auto-decrypt view once messages

*How to use:*
- All commands must start with a dot (.)
- Example: .ping
- Fork the bot: https://github.com/basanzietech/queen-shakira`;
    await sock.sendMessage(jid, { text: helpText });
  },
  async owner(sock, jid) {
    const vcard = 'BEGIN:VCARD\n'
      + 'VERSION:3.0\n'
      + 'FN:Queen Shakira Owner\n'
      + 'ORG:Queen Shakira Bot;\n'
      + 'TEL;type=CELL;type=VOICE;waid=255657779003:+255 657 779 003\n'
      + 'END:VCARD';
    await sock.sendMessage(jid, {
      contacts: {
        displayName: 'Queen Shakira Owner',
        contacts: [{ vcard }]
      }
    });
  },
  async handleViewOnce(sock, msg, ownerJid) {
    // If message is viewOnce, resend it to sender or owner
    const inner = msg.message.viewOnceMessage.message;
    const jid = msg.key.remoteJid;
    if (inner.imageMessage || inner.videoMessage || inner.audioMessage || inner.documentMessage) {
      // Forward media as normal (remove viewOnce)
      await sock.sendMessage(jid, { ...inner, viewOnce: false });
      if (ownerJid) await sock.sendMessage(ownerJid, { ...inner, viewOnce: false });
    } else {
      // Forward text
      const text = inner.conversation || '';
      await sock.sendMessage(jid, { text: `ViewOnce: ${text}` });
      if (ownerJid) await sock.sendMessage(ownerJid, { text: `ViewOnce: ${text}` });
    }
  },
  // Add more commands as needed
};

module.exports = commands; 