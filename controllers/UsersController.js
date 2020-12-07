const jwt = require("jsonwebtoken");
const uuid = require("uuid");
// const bcrypt = require('bcrypt')
const SHA256 = require("crypto-js/sha256");
const UserModel = require("../models/users");
const UserPortfolioModel = require("../models/user_portfolio");
const rp = require("request-promise");
const { render } = require("ejs");
//import token logos
// const tokenLogos = require('./node_modules/cryptocurrency-icons')

const controllers = {
  showRegistrationForm: (req, res) => {
    // check if user if logged in
    // if logged in, redirect back to dashboard

    if (req.session && req.session.user) {
      res.redirect("/users/dashboard");
      return;
    }
    res.render("users/register", {
      pageTitle: "Register as a User",
    });
  },

  showLoginForm: (req, res) => {
    res.render("users/login", {
      pageTitle: "User Login",
    });
  },

  register: (req, res) => {
    // validate the users input
    // not implemented yet, try on your own

    UserModel.findOne({
      email: req.body.email,
    })
      .then((result) => {
        // if found in DB, means email has already been take, redirect to registration page
        if (result) {
          return res.json({
            success: false,
            message: "Email is already taken.",
          });
        }

        // no document found in DB, can proceed with registration

        // generate uuid as salt
        const salt = uuid.v4();

        // hash combination using bcrypt
        const combination = salt + req.body.password;

        // hash the combination using SHA256
        const hash = SHA256(combination).toString();

        // create user in DB
        UserModel.create({
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          pwsalt: salt,
          hash: hash,
          chatRooms: ["gossip"],
        })
          .then((createResult) => {
            req.session.user = createResult;
            UserPortfolioModel.create({
              portfolio: [],
              name: req.body.first_name,
              user_ID: createResult._id,
            });
            return res.json({
              success: true,
            });
          })
          .catch((err) => {
            //res.redirect('/users/register')
            return res.json({
              success: false,
              err,
            });
          });
      })
      .catch((err) => {
        console.log(err);
        return res.json({
          success: false,
          err,
        });
      });
  },
  addPortfolio: (req, res) => {
    var decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    UserPortfolioModel.create({
      portfolio: [],
      name: req.body.name,
      user_ID: decoded.sub,
    })
      .then((data) => res.json(data))
      .catch((err) => {
        console.log(err);
        res.json(null);
      });
  },

  login: (req, res) => {
    // gets user with the given email
    UserModel.findOne({
      email: req.body.email,
    })
      .then((result) => {
        // check if result is empty, if it is, no user, so login fail, redirect to login page
        if (!result) {
          console.log("err: no result");
          res.json({
            success: false,
          });
          return;
        }
        // combine DB user salt with given password, and apply hash algo
        const hash = SHA256(result.pwsalt + req.body.password).toString();

        // check if password is correct by comparing hashes
        if (hash !== result.hash) {
          console.log("err: hash does not match");
          res.redirect("/users/login");
          return;
        }

        // login successful

        console.log("login success");

        const token = jwt.sign(
          {
            sub: result.id,
            name: result.first_name,
            email: result.email,
            chatRooms: result.chatRooms,
          },
          process.env.JWT_SECRET,
          {
            algorithm: "HS384",
            expiresIn: "1h",
          }
        );
        // decode JWT to get raw values
        const rawJWT = jwt.decode(token);

        // return token as json response
        res.json({
          success: true,
          token: token,
          expiresAt: rawJWT.exp,
        });
      })
      .catch((err) => {
        res.statusCode = 500;
        res.json({
          success: false,
          message: "unable to login due to unexpected error",
        });
      });
  },
  logout: (req, res) => {
    req.session.destroy(function (err) {
      console.log(err);
    });
    res.redirect("../");
  },
  dashboard: (req, res) => {
    var decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    console.log(decoded); // bar
    UserPortfolioModel.findOne({ user_ID: decoded.sub })
      .then((data) => {
        let defaultList = "btc,eth,xrp,bnb,eos,ltc,usdt,xtz,bch,bsv,link,dot,ada,xmr,trx,xlm,neo".split(
          ","
        );
        let list = Array.from(
          new Set([...data.portfolio.map((i) => i.symbol), ...defaultList])
        );

        const requestOptions = {
          method: "GET",
          uri: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${list.join()}`,
          headers: {
            "X-CMC_PRO_API_KEY": "f7eb16ab-8a3c-4086-8d33-1e76b4cfe6d3",
          },
          json: true,
          gzip: true,
        };

        rp(requestOptions)
          .then((response) => {
            res.json({
              user: data,
              items: response.data,
            });
          })
          .catch((err) => {
            console.log("API call error:", err.message);
          });
      })
      .catch((err) => console.log(err));
  },

  getAllPortfolios: (req, res) => {
    var decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    console.log(decoded); // bar
    UserPortfolioModel.find({ user_ID: decoded.sub })
      .then((data) => {
        let portfolios = data.map((item) => {
          return {
            name: item.name ? item.name : "Main",
            id: item.id,
          };
        });
        console.log(portfolios);
        res.json(portfolios);
      })
      .catch((err) => console.log(err));
  },

  newToken: (req, res) => {
    res.render("users/new", {
      loginStatus: Boolean(req.session.user),
      inputs: req.query,
    });
  },

  createToken: (req, res) => {
    //if (req.session.user) {
    //update the user
    const newToken = {
      symbol: req.body.symbol,
      date: req.body.date,
      price: req.body.price,
      qty: +req.body.qty,
    };
    console.log(newToken);

    //console.log(req.session.user);
    //req.session.user.portfolio.push(newToken);
    //also need to update seesion
    var decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    //UserModel.findById(hardCodeId).then((respond) => {
    let query = { user_ID: decoded.sub };
    if (req.query.portfolioId !== undefined) {
      query = { id: req.query.portfolioId };
    }
    UserPortfolioModel.updateOne(query, {
      $push: {
        portfolio: newToken,
      },
    })

      .then((data) => res.json(data))
      .catch((err) => {
        console.log(err);
        res.json(null);
      });
    //});
    // } else {
    //res.json("wrong user");
    //}
  },

  updatePortfolio: (req, res) => {
    // find the document in DB,
    // to ensure that whatever the user
    // wants to edit, is actually present
    var decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    UserPortfolioModel.findOne({
      user_ID: decoded.sub, //'kevin@gmail.com'
    })
      .then((result) => {
        let portfolio = result.portfolio;
        portfolio.splice(req.body.index, 1);
        UserPortfolioModel.updateOne(
          {
            user_ID: decoded.sub, //'kevin@gmail.com'
          },
          {
            $set: {
              portfolio: portfolio,
            },
          }
        )
          .then((updateResult) => {
            res.json(updateResult);
          })
          .catch((err) => {
            console.log(err);
            res.json(null);
          });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/users/dashboard");
      });
  },
  editPortfolio: (req, res) => {
    // find the document in DB,
    // to ensure that whatever the user
    // wants to edit, is actually present
    var decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    UserPortfolioModel.findOne({
      user_ID: decoded.sub, //'kevin@gmail.com'
    })
      .then((result) => {
        let portfolio = result.portfolio;
        let { index, ...rest } = req.body;
        rest.qty = Number(req.body.qty);
        console.log(rest);
        portfolio[index] = rest;
        UserPortfolioModel.updateOne(
          {
            user_ID: decoded.sub, //'kevin@gmail.com'
          },
          {
            $set: {
              portfolio: portfolio,
            },
          }
        )
          .then((updateResult) => {
            res.json(updateResult);
          })
          .catch((err) => {
            console.log(err);
            res.json(null);
          });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/users/dashboard");
      });
  },
  deleteAccount: (req, res) => {
    UserModel.deleteOne({
      email: req.session.user.email, //'kevin@gmail.com'
    })
      .then((result) => {
        req.session.destroy(function (err) {
          console.log(err);
        });
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/");
      });
  },
};

module.exports = controllers;
