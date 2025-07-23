// bot/utils.js
function getMessageText(msg) {
  if (msg.message.conversation) return msg.message.conversation;
  if (msg.message.extendedTextMessage?.text)
    return msg.message.extendedTextMessage.text;
  if (msg.message.imageMessage?.caption)
    return msg.message.imageMessage.caption;
  if (msg.message.videoMessage?.caption)
    return msg.message.videoMessage.caption;
  return '';
}

module.exports = {
  getMessageText
}; 