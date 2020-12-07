const messageModel = require("../models/messageModel");
const roomModel = require("../models/roomModel");
const userModel = require("../models/users");
const uuid = require("uuid");
const SHA256 = require("crypto-js/sha256");
const controllers = {
  hello: (req, res) => {
    res.status(200).send("Hello world");
  },
  newMessage: (req, res) => {
    console.log(req);
    const dbMessage = req.body;
    messageModel.create(dbMessage, (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send(data);
      }
    });
  },
  syncMessages: (req, res) => {
    messageModel.find((err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send(data);
      }
    });
  },
  syncMessagesByRoom: (req, res) => {
    //console.log(req.params);
    messageModel
      .find({
        room: req.params.room,
      })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.send(err);
      });
    // messageModel.find((err, data) => {
    //   if (err) {
    //     res.status(500).send(err);
    //   } else {
    //     res.status(200).send(data);
    //   }
    // });
  },
  newRoom: (req, res) => {
    //console.log(req.body);
    const room = req.body;
    const hash = SHA256(req.body.from + req.body.to).toString();

    userModel
      .findOneAndUpdate({ email: room.from }, { $push: { chatRooms: hash } })
      .then((fromResult) => {
        userModel
          .findOneAndUpdate(
            { email: room.to },
            { $push: { chatRooms: [hash] } }
          )
          .then((toResult) => {
            roomModel
              .create({
                roomID: hash,
                emails: [room.from, room.to],
                usernames: [fromResult.first_name, toResult.first_name],
              })
              .then((result) => {
                res.send(result);
              })
              .catch((err) => {
                res.send(err);
              });
          })
          .catch((err) => {
            res.send(err);
          });
      })
      .catch((err) => {
        res.send(err);
      });
  },
  syncRooms: (req, res) => {
    userModel
      .find({
        email: res.locals.userData.email,
      })
      .then((result) => {
        console.log(result);
        roomModel
          .find({ emails: { $all: [res.locals.userData.email] } })
          .then((result) => {
            result.unshift({
              emails: ["Everyone"],
              usernames: ["Everyone"],
              roomID: "gossip",
            });
            console.log(result);
            res.send(result);
          })
          .catch((err) => {
            res.send(err);
          });
      })

      .catch((err) => {
        res.send(err);
      });
  },
  findRoom: (req, res) => {
    console.log(req.params);
    roomModel
      .findOne({
        roomID: req.params.room,
      })
      .then((result) => {
        console.log(result);
        res.send(result);
      })
      .catch((err) => {
        res.send(err);
      });
  },
};
module.exports = controllers;
