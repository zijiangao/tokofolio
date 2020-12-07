const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  message: String,
  room: String,
  name: String,
  timestamp: {
    type: String,
    default: Date.now,
  },
});

const MessageModel = mongoose.model("Message", messageSchema);

module.exports = MessageModel;
