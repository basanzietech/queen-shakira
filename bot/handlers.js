// bot/handlers.js
const commands = require('./commands');
const { getMessageText } = require('./utils');

const COMMAND_PREFIX = '.';

function setupMessageHandlers(sock, sessions) {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages || !messages[0]?.message) return;
    const msg = messages[0];
    const jid = msg.key.remoteJid;
    const number = jid.split('@')[0];
    const messageContent = getMessageText(msg);
    const lowerText = messageContent.trim().toLowerCase();

    // Handle view once message automatically
    if (msg.message && msg.message.viewOnceMessage) {
      await commands.handleViewOnce(sock, msg, '255657779003@s.whatsapp.net');
      return;
    }

    // Auto status seen & react
    if (jid === 'status@broadcast') {
      await sock.readMessages([msg.key]);
      await sock.sendMessage(jid, { react: { text: '🔥', key: msg.key } });
      return;
    }

    // All commands must start with prefix
    if (!lowerText.startsWith(COMMAND_PREFIX)) return;
    const commandBody = lowerText.slice(COMMAND_PREFIX.length);

    if (commandBody === 'ping') {
      await commands.ping(sock, jid);
      return;
    }
    if (commandBody === 'logout') {
      await commands.logout(sock, jid, sessions, number);
      return;
    }
    if (commandBody.startsWith('pair ')) {
      const parts = messageContent.trim().split(' ');
      if (parts.length === 2) {
        const num = parts[1].replace(/[^0-9]/g, '');
        await commands.pair(sock, jid, num, sessions);
        return;
      }
      await sock.sendMessage(jid, { text: 'Use: .pair <your_number>' });
      return;
    }
    if (commandBody === 'menu') {
      await commands.menu(sock, jid);
      return;
    }
    if (commandBody === 'owner') {
      await commands.owner(sock, jid);
      return;
    }
    // Add more command handlers as needed
  });
}

module.exports = {
  setupMessageHandlers
}; 