const router = require("express").Router();
const auth = require("../middlewares/auth");
const _voucherService = require("../services/VoucherService");
const _userService = require("../services/UserService");

router.get("/", auth.isStaff, async (req, res) => {
  try {
    var customerVouchers = await _voucherService.getAllCustomerVouchers();
    return res.status(200).json(customerVouchers);
  } catch (err) {
    return res.status(500).json("error");
  }
});

router.get("/:id", auth.isStaff, async (req, res) => {
  try {
    var id = req.params.id;
    var customerVoucher = await _voucherService.getCustomerVoucherById(id);
    if (customerVoucher == null) {
      return res.status(404).json("Customer voucher not found");
    }
    return res.status(200).json(customerVoucher);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get(
  "/customer/:id",
  auth.isUser || auth.isAdmin || auth.isStaff,
  async (req, res) => {
    try {
      var id = req.params.id;
      var customerVoucher =
        await _voucherService.getCustomerVouchersByCustomerId(id);
      if (customerVoucher == null) {
        return res.status(404).json("Customer not found");
      }
      return res.status(200).json(customerVoucher);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

router.post("/", auth.isStaff, async (req, res) => {
  try {
    var voucherId = req.body.voucherId;
    var customerId = req.body.customerId;
    if (customerId == null || voucherId == null) {
      return res.status(400).json("Invalid input");
    }

    const voucher = await _voucherService.getVoucherById(voucherId);
    const customer = await _userService.getById(customerId);

    if (voucher == null) {
      res.status(404).json("Voucher is invalid");
    }
    if (customer == null) {
      res.status(404).json("Customer is invalid");
    }

    var isCustomerVoucherExisted =
      await _voucherService.isCustomerVoucherExisted(voucher._id, customer._id);
    if (isCustomerVoucherExisted == true) {
      return res.status(400).json("This customer already had this voucher.");
    }

    var newcustomerVoucher = {
      voucherId,
      customerId,
      dueDate: (new Date().getTime() + 60*60*1000*24*voucher.duration),
    };
    newCustomerVoucher = await _voucherService.createCustomerVoucher(
      newcustomerVoucher
    );

    if (newcustomerVoucher == null) {
      return res.status(500);
    }
    return res.status(200).json(newcustomerVoucher);
  } catch (error) {
    console.log(error)
    return res.status(500).json(error);
  }
});

router.put("/:id", auth.isStaff, async (req, res) => {});

router.delete("/:id", auth.isStaff, async (req, res) => {
  var id = req.params.id;
  var customerVoucher = await _voucherService.getCustomerVoucherById(id);
  if (customerVoucher === null) {
    return res.status(404).json(false);
  }
  await _voucherService.deleteCustomerVoucher(id);
  return res.status(200).json(true);
});

router.post("/useVoucher", auth.isUser, async (req, res) => {});

module.exports = router;
