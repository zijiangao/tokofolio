const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomID: {
    type: String,
    unique: true,
  },
  emails: [String],
  usernames: [String],
});

const RoomModel = mongoose.model("Room", roomSchema);

module.exports = RoomModel;
