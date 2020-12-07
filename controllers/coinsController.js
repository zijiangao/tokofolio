const rp = require("request-promise");

const controllers = {
  listCoins: (req, res) => {
    const requestOptions = {
      method: "GET",
      uri: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=btc,eth,xrp,bnb,eos,ltc,usdt,xtz,bch,bsv,link,dot,ada,xmr,trx,xlm,neo`,
      headers: {
        "X-CMC_PRO_API_KEY": "f7eb16ab-8a3c-4086-8d33-1e76b4cfe6d3", //process.env.API_KRY
      },
      json: true,
      gzip: true,
    };

    rp(requestOptions)
      .then((response) => {
        res.render("homepage", {
          pageTitle: "Start your Tokofolio today!",
          items: response.data,
          loginStatus: Boolean(req.session.user),
        });
      })
      .catch((err) => {
        console.log("API call error:", err.message);
      });
  },

  getLatest: (req, res) => {
    let data = [];
    res.json(data);
  },
  showCoins: (req, res) => {
    let search = req.query.search;
    loginStatus: Boolean(req.session.user);

    const requestOptions = {
      method: "GET",
      uri: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${search}`,
      headers: {
        "X-CMC_PRO_API_KEY": "f7eb16ab-8a3c-4086-8d33-1e76b4cfe6d3",
      },
      json: true,
      gzip: true,
    };

    rp(requestOptions)
      .then((response) => {
        res.render("portfolio", {
          pageTitle: "Show Coin",
          loginStatus: Boolean(req.session.user),
          items: Object.values(response.data),
        });
      })
      .catch((err) => {
        console.log("API call error:", err.message);
      });
  },
  showCoinsData: (req, res) => {
    let search = req.query.search;
    loginStatus: Boolean(req.session.user);

    const requestOptions = {
      method: "GET",
      uri: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${search}`,
      headers: {
        "X-CMC_PRO_API_KEY": "f7eb16ab-8a3c-4086-8d33-1e76b4cfe6d3",
      },
      json: true,
      gzip: true,
    };

    rp(requestOptions)
      .then((response) => {
        res.json(response.data);
      })
      .catch((err) => {
        console.log("API call error:", err.message);
      });
  },
};

function checkParamId(givenID, collection) {
  if (givenID < 0 || givenID > collection.length - 1) {
    return false;
  }

  return true;
}

module.exports = controllers;
