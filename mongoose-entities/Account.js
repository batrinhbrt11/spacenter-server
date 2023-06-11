const mongoose = require("mongoose");
const AccountSchema = new mongoose.Schema(
  {
    username: {
        type: String,
        required: true,
        unique: true
      },
      password: {
        type: String,
        required: true
      },
      role: {
        type: String,
        enum: ["admin", "staff", "customer"],
      }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Account", AccountSchema);
