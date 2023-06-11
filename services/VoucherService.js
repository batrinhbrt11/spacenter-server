const Voucher = require("../mongoose-entities/Voucher");
const CustomerVoucher = require("../mongoose-entities/CustomerVoucher");
const mongoose = require("mongoose");
const User = require("../mongoose-entities/User");
const _userService = require("./UserService");
const userRole = require("../models/Role");

const createVoucher = async (voucher) => {
    var newVoucher = new Voucher({
        voucherName: voucher.voucherName,
        voucherCode: voucher.voucherCode,
        duration: voucher.duration
    });
    await newVoucher.save( async(err, data) => {
        if (err){
            newVoucher = null;
        }            
        newVoucher = data;
    });
    return newVoucher;
}

const updateVoucher = async (voucher) => {
    var updatedVoucher = await Voucher.findByIdAndUpdate(voucher._id, 
        {
            voucherName: voucher.voucherName,
            voucherCode: voucher.voucherCode,
            duration: voucher.duration
        });
    return updatedVoucher;
}

const deleteVoucher = async (id) => {
    await Voucher.findByIdAndDelete(id);
}

const getAllVouchers = async () => {
    var vouchers = await Voucher.find();
    return vouchers;
}

const getVoucherById = async (id) => {
    var voucher = await Voucher.findById(id);
    return voucher;
}
const getVoucherByCode = async (voucherCode) => {
    var voucher = await Voucher.findOne({ voucherCode: voucherCode});
    return voucher;
}

const isVoucherExisted = async (voucher) => {
    var voucher = await getVoucherByCode(voucher.voucherCode);
    if (voucher != null){
        return true;
    }
    return false;
}



const createCustomerVoucher = async (customerVoucher) => {
    var newCustomerVoucher = new CustomerVoucher({
        voucherId: customerVoucher.voucherId,
        customerId: customerVoucher.customerId,
        dueDate: customerVoucher.dueDate
    });
    var result = await newCustomerVoucher.save();

    var customerVoucher = await getCustomerVoucherById(result._id);
    return customerVoucher;
}

const deleteCustomerVoucher = async(id) => {
    await CustomerVoucher.findByIdAndDelete(id);
}

const getAllCustomerVouchers = async () => {
    var customerVouchers = await CustomerVoucher.aggregate([
        {
          $lookup: {
            from: "vouchers",
            localField: "voucherId",
            foreignField: "_id",
            as: "voucher",
          }
        },
        { $unwind: "$voucher" },
        {
            $lookup: {
              from: "users",
              localField: "customerId",
              foreignField: "_id",
              as: "customer",
            },
        },
        { $unwind: "$customer" },      
        {   
            $project:{
                _id : "$voucherId",
                voucherCustomerId:"$_id",
                voucherName : "$voucher.voucherName",
                voucherCode : "$voucher.voucherCode",
                dueDate: 1,
                customerId: 1,
                isUsed: 1
            } 
        }
    ]);
    var customers = await _userService.getAllUsers(userRole.Customer);
    // for(i = 0; i < customers.length; i++){
    //     customers[i].vouchers = [];
    //     for(j = 0; j < customerVouchers.length; j++){
    //         if (customerVouchers[j].customerId.equals(customers[i]._id)){
    //             console.log("cv1", customerVouchers[j].customerId);
    //             console.log("c", customers[i]._id);
    //             customers[i].vouchers.push(customerVouchers[j]);
    //         }
    //     }
    // }
    customers.forEach(c => {
        c.vouchers = [];
        customerVouchers.forEach(cv => {
            if (cv.customerId.equals(c._id)){
                c.vouchers.push(cv);
            }
        })
    })
    // var grouped = groupBy(customerVouchers, customerVoucher => customerVoucher.customerId);
    // console.log(grouped);
    // customers.forEach(c => {
    //     console.log(c._id);
    //     c.vouchers = grouped.get(c._id);
    // })

    return  customers.filter(c => c.vouchers.length !== 0 );
}

const getCustomerVouchersByCustomerId = async (customerId) => {
    var customerVouchers = await getAllCustomerVouchers();
    customerVouchers = customerVouchers.filter(c => c._id.equals(customerId));
    return customerVouchers[0];
}

const getCustomerVoucherById = async (id) => {
    var customerVoucher = await CustomerVoucher.aggregate([
        {
          $lookup: {
            from: "vouchers",
            localField: "voucherId",
            foreignField: "_id",
            as: "voucher",
          }
        },
        { $unwind: "$voucher" },
        {
            $lookup: {
              from: "users",
              localField: "customerId",
              foreignField: "_id",
              as: "customer",
            },
        },
        { $unwind: "$customer" },      
        {   
            $project:{
                _id : 1,
                voucherName : "$voucher.voucherName",
                voucherCode : "$voucher.voucherCode",
                dueDate: 1,
                isUsed: 1,
                customer: "$customer"
            } 
        },
        { $match: { _id: mongoose.Types.ObjectId(id) } }
    ]);
    return customerVoucher[0];
}

const isCustomerVoucherExisted = async (voucherId, customerId) => {
    var customerVoucher = await CustomerVoucher.findOne({ voucherId: voucherId, customerId: customerId });
    if(customerVoucher != null){
        return true;
    }
    return false;
}

const getCustomerVouchersByVoucherCode = async (voucherCode) => {
    var customerVouchers = await CustomerVoucher.aggregate([
        {
          $lookup: {
            from: "vouchers",
            localField: "voucherId",
            foreignField: "_id",
            as: "voucher",
          }
        },
        { $unwind: "$voucher" },
        {
            $lookup: {
              from: "users",
              localField: "customerId",
              foreignField: "_id",
              as: "customer",
            },
        },
        { $unwind: "$customer" },      
        {   
            $project:{
                _id : 1,
                voucherName : "$voucher.voucherName",
                voucherCode : "$voucher.voucherCode",
                dueDate: 1,
                isUsed: 1,
                customer: "$customer",
            } 
        },
        { $match: { voucherCode: mongoose.Types.ObjectId(voucherCode) } }
    ]);
    
    return customerVouchers;
}

const deleteCustomerVouchesrByVoucherId = async (id) => {
    await CustomerVoucher.deleteMany({ voucherId: id});
}

module.exports = {
    createVoucher,
    updateVoucher,
    deleteVoucher,
    getAllVouchers,
    getVoucherById,
    getVoucherByCode,
    isVoucherExisted,
    createCustomerVoucher,
    deleteCustomerVoucher,
    getAllCustomerVouchers,
    getCustomerVouchersByCustomerId,
    getCustomerVoucherById,
    isCustomerVoucherExisted,
    getCustomerVouchersByVoucherCode,
    deleteCustomerVouchesrByVoucherId
}
