const mongoose = require("mongoose");
const referrenceValidator = require("mongoose-referrence-validator");

const MessageSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, { timestamps: true });

MessageSchema.plugin(referrenceValidator);
module.exports = mongoose.model("Message", MessageSchema);

