const mongoose = require("mongoose");
const moment = require("moment");
const messageSchema = new mongoose.Schema({
  message: String,
  room: String,
  name: String,
  timestamp: {
    type: String,
    default: moment().unix(),
  },
});

const MessageModel = mongoose.model("Message", messageSchema);

module.exports = MessageModel;
