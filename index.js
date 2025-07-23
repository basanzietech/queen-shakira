// index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { setupMessageHandlers } = require('./bot/handlers');
const pairRoute = require('./routes/pair');

// Express routes
app.use('/', pairRoute);

// Basic landing page
app.get('/status', (req, res) => {
  res.send('Queen Shakira bot is running!');
});

// === Bot startup ===
const sessions = new Map();

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true
  });
  sock.ev.on('creds.update', saveCreds);
  setupMessageHandlers(sock, sessions);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== 401);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Connected');
    }
  });
}

startBot().catch(err => console.log('Unexpected error:', err));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
