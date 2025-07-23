// bot/handlers.js
const commands = require('./commands');

function setupMessageHandlers(sock, sessions) {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages || !messages[0]?.message) return;
    const msg = messages[0];
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;
    const messageContent = msg.message.conversation || '';
    const lowerText = messageContent.trim().toLowerCase();
    const number = jid.split('@')[0];

    if (lowerText === 'ping') {
      await commands.ping(sock, jid);
      return;
    }
    if (lowerText === 'logout') {
      await commands.logout(sock, jid, sessions, number);
      return;
    }
    if (lowerText.startsWith('pair ')) {
      const parts = messageContent.split(' ');
      if (parts.length === 2) {
        const num = parts[1].replace(/[^0-9]/g, '');
        await commands.pair(sock, jid, num, sessions);
        return;
      }
      await sock.sendMessage(jid, { text: 'Use: pair <your_number>' });
      return;
    }
    // Add more command handlers as needed
  });
}

module.exports = {
  setupMessageHandlers
}; 