const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userPortfolioSchema = new Schema({
  portfolio: [
    {
      symbol: String,
      date: String,
      price: String,
      qty: {
        type: Number,
        min: 0,
      },
    },
  ],
  name: String,
  user_ID: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
});

const UserPortfolioModel = mongoose.model("UserPortfolio", userPortfolioSchema);

module.exports = UserPortfolioModel;
