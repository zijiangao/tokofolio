// =======================================
//              DEPENDENCIES
// =======================================
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const usersController = require("./controllers/UsersController");
const chatController = require("./controllers/chatController");
const messageModel = require("./models/messageModel");
const roomModel = require("./models/roomModel");
const Pusher = require("pusher");
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
// =======================================
//              MONGOOSE
// =======================================

const mongoURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
mongoose.set("useFindAndModify", false);
// mongoose.connect( mongoURI, { useNewUrlParser: true, useUnifiedTopology: true } )

const coinsController = require("./controllers/coinsController");

// =======================================
//              EXPRESS SETUP
// =======================================
// sets template engine to use
app.set("view engine", "ejs");

// tells Express app where to find our static assets
app.use(express.static("public"));

// tells Express app to make use of the imported method-override library
app.use(methodOverride("_method"));

// tells Express app to parse incoming form requests,
// and make it available in req.body
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    name: "app_session",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 }, // 3600000ms = 3600s = 60mins, cookie expires in an hour
  })
);

// =======================================
//              ROUTES
// =======================================

// app.get('/', (req, res) => {
//     res.send('Hello cruel World!')
//   })

// index route
app.get("/", coinsController.listCoins);

// show route
app.get("/coin-portfolio/", coinsController.showCoins);

// show route
app.get("/coin-portfolio-data/", coinsController.showCoinsData);

// user registration form route
app.get("/users/register", usersController.showRegistrationForm);

// user registration
app.post("/users/register", usersController.register);

// user login form route
app.get("/users/login", usersController.showLoginForm);

// user logout  route
app.get("/users/logout", usersController.logout);

app.post("/users/login", usersController.login);

// new token

app.get("/users/dashboard/new", usersController.newToken);

// // create token

app.post("/users/dashboard/new", usersController.createToken);

// // user dashboard
app.get("/users/dashboard", usersController.dashboard);

//portfolios
app.get("/users/portfolios", usersController.getAllPortfolios);

// update/delete route
app.patch("/users/dashboard", usersController.updatePortfolio);

// edit portfolio item
app.patch("/user/portfolio", usersController.editPortfolio);

app.post("/user/portfolio", usersController.addPortfolio);

// delete route
app.delete("/users/delete", usersController.deleteAccount);
// =======================================
//              CHAT ROUTES
// =======================================
app.get("/api/v1/message", chatController.hello);
app.post("/api/v1/message/new", chatController.newMessage);
app.get("/api/v1/message/sync", chatController.syncMessages);
app.get("/api/v1/message/syncbyroom/:room", chatController.syncMessagesByRoom);
app.post("/api/v1/room/new", chatController.newRoom);
app.get("/api/v1/room/sync", verifyJWT, chatController.syncRooms);
app.get("/api/v1/room/:room", chatController.findRoom);
const pusher = new Pusher({
  appId: "1109948",
  key: "639cb43c9e51d063cebf",
  secret: "b8914461fc6d42c4e3a7",
  cluster: "ap1",
  useTLS: true,
});
const changeStreamRoom = roomModel.watch();
changeStreamRoom.on("change", (change) => {
  console.log(change);
  if (change.operationType === "insert") {
    const roomDetails = change.fullDocument;
    pusher.trigger("rooms", "insert", {
      emails: roomDetails.emails,
      usernames: roomDetails.usernames,
      roomID: roomDetails.roomID,
    });
  }
});
const changeStream = messageModel.watch();
changeStream.on("change", (change) => {
  console.log(change);
  if (change.operationType === "insert") {
    const messageDetails = change.fullDocument;
    pusher.trigger("messages", "insert", {
      name: messageDetails.name,
      room: messageDetails.room,
      message: messageDetails.message,
      timestamp: messageDetails.timestamp,
    });
  }
});

// / =======================================
//              LISTENER
// =======================================
console.log(mongoURI);
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((response) => {
    console.log("DB connection successful");
    app.listen(port, () => {
      console.log(`Tokofolio listening on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

function verifyJWT(req, res, next) {
  // get the jwt token from the request header
  const authToken = req.headers.auth_token;

  // check if authToken header value is empty, return err if empty
  if (!authToken) {
    res.json({
      success: false,
      message: "Auth header value is missing",
    });
    return;
  }

  // verify that JWT is valid and not expired
  try {
    // if verify success, proceed
    const userData = jwt.verify(authToken, process.env.JWT_SECRET, {
      algorithms: ["HS384"],
    });
    res.locals.userData = userData;

    next();
  } catch (err) {
    // if fail, return error msg
    res.json({
      success: false,
      message: "Auth token is invalid",
    });
    return;
  }
}
