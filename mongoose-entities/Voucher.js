const mongoose = require("mongoose");


const VoucherSchema = new mongoose.Schema({
    voucherName: {
        type: String,
        required: true
    },
    voucherCode: {
        type: String,
        required: true,
        unique: true
    },
    duration: {
        type: Number,
        require: true
    }
}, {timestamps: true});

module.exports = mongoose.model("Voucher", VoucherSchema);