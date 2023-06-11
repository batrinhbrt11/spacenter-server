const router = require("express").Router();
const auth = require("../middlewares/auth");
const Voucher = require("../mongoose-entities/Voucher");
const userRole = require("../models/Role");
const CustomerVoucher = require("../mongoose-entities/CustomerVoucher");
const _voucherService = require("../services/VoucherService");

router.get("/", auth.isStaff || auth.isAdmin, async (req, res) => {
  try {
    var vouchers = await _voucherService.getAllVouchers();
    return res.status(200).json(vouchers);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get("/:id",auth.isStaff || auth.isAdmin, async (req, res) => {
  var id = req.params.id;
  var voucher = await _voucherService.getVoucherById(id);
  if (!voucher) {
    return res.status(400);
  }
  return res.status(200).json(voucher);
});

router.post("/", auth.isStaff || auth.isAdmin, async (req, res) => {
  try {
    var voucherName = req.body.voucherName;
    var voucherCode = req.body.voucherCode;
    var duration = req.body.duration;
    if (voucherName == null || voucherCode == null || duration == null) {
      return res.status(400);
    }
    var newVoucher = { voucherName, voucherCode, duration };
    var isVoucherExisted = await _voucherService.isVoucherExisted(newVoucher);
    if (isVoucherExisted) {
      return res
        .status(400)
        .json({ errorMsg: "Voucher code is already existed." });
    }
    newVoucher = await _voucherService.createVoucher(newVoucher);
    if (newVoucher == null) {
      return res.status(500).json("Can not create new voucher.");
    }
    return res.status(200).json(newVoucher)
  } catch (err) {
    console.log(err);
  }
});

router.put('/:id', auth.isStaff, async (req, res) => {
   try{
    var id = req.params.id;
    var voucherName = req.body.voucherName;
    var voucherCode = req.body.voucherCode;
    var duration = req.body.duration;

    if (req.role == userRole.Staff && !req.user.id.equals(id)){
        return res.status(403).json("You do not have permission");
    }
    var updateVoucher = {
        _id:id,
        voucherName,
        voucherCode,
        duration
    }

    var updateVoucher = await _voucherService.updateVoucher(updateVoucher);
    return res.status(200).json(updateVoucher);
   }
   catch(err){
        return res.status(400).json(err);
   }
})

router.delete('/:id', auth.isStaff, async (req, res) => {
    var id = req.params.id;
    var voucher = await _voucherService.getVoucherById(id);
    if (voucher == null) {
        return res.status(404).json("Voucher not found");
    }
    var customerVouchers = await _voucherService.getCustomerVouchersByVoucherCode();
    if (customerVouchers.length > 0) {
      customerVouchers = customerVouchers.filter(cv => cv.dueDate >= new Date());
    }
    if (customerVouchers.length > 0){
        return res.status(400).json("Cannot delete because we have customer vouchers which are using this voucher.");
    }
    await _voucherService.deleteCustomerVouchesrByVoucherId(voucher._id);
    await _voucherService.deleteVoucher(voucher._id);
    return res.status(200).json(true);
})

module.exports = router; 
