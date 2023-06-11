const mongoose = require("mongoose");
const referrenceValidator = require("mongoose-referrence-validator");

const CustomerVoucherSchema = new mongoose.Schema({
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher'
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dueDate: {
        type: Date,
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

CustomerVoucherSchema.plugin(referrenceValidator);

module.exports = mongoose.model("CustomerVoucher", CustomerVoucherSchema)