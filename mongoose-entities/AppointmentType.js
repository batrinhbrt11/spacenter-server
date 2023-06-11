const mongoose = require("mongoose");

const AppointmentType = new mongoose.Schema(
  {
      name: {
        type: String,
        required: true
      }
  },
  { timestamps: true }
);
module.exports = mongoose.model("AppointmentType", AppointmentType);
