const router = require("express").Router();
const auth = require("../middlewares/auth");
const _appointmentService = require("../services/AppointmentService");
const _smsService = require("../services/SmsService");
const _userService = require("../services/UserService");
const userRole = require("../models/Role");

router.get("/", auth.isUser, async (req, res) => {
  var appointments = await _appointmentService.getAllAppointments();
  if (
    req.role == userRole.Customer
  ) {

    appointments=appointments.filter((a) => (a.customerId !== null && a.customerId.equals(req.user._id) ));
  }

  return res.status(200).json(appointments);
});

router.get("/:id", auth.isUser, async (req, res) => {
  var appointmentId = req.params.id;
  const appointment = await _appointmentService.getAppointmentById(
    appointmentId
  );
  return res.status(200).json(appointment);
});

router.post("/", async (req, res) => {
    try {
      const appointment = {
        appointmentTypeId: req.body.appointmentTypeId,
        phoneNumber: req.body.phoneNumber,
        customerName: req.body.customerName,
        customerId: req.body.customerId,
        date: Date.parse(req.body.date),
      };

      const appointmentType = await _appointmentService.getAppointmentTypeById(
        appointment.appointmentTypeId
      );
      const availableStaffs = await _userService.getAvailableStaffAtTime(appointment.date);

      if (availableStaffs.length == 0){
        return res.status(400).json("This booking time is not available. Because no staff is avaiable at this time.")
      }

      appointment.staffId = availableStaffs[0]._id;

      if (appointment.customerId !== "") {
        const customer = await _userService.getUserById(
          appointment.customerId,
          userRole.Customer
        );
        console.log(appointmentType)
        console.log(customer)
        if (appointmentType == null || customer == null)
          return res.status(400).json("Something was wrong.");
        const isCustomerBookThisTime = await _appointmentService.isCustomerBookThisTime(customer._id,"", appointment.date);

        if (isCustomerBookThisTime){
          return res.status(400).json("Customer already had a appointment at this time.");
        }
        const result = await _appointmentService.createAppointment(appointment);
        return res.status(200).json(result);
      } else {
        if (appointmentType == null)
          return res.status(400).json("Something was wrong.");
  
        const isCustomerBookThisTime = await _appointmentService.isCustomerBookThisTime("",appointment.phoneNumber, appointment.date);

        if (isCustomerBookThisTime){
          return res.status(400).json("Customer already had a appointment at this time.");
        }
        const result =
          await _appointmentService.createAppointmentWithOutCustomerId(
            appointment
          );
        return res.status(200).json(result);
      }
      // if(result) {
      //     var message = `Xin chào ${result.customer.name}\nNguyễn Anh Vy muốn gửi lời yêu thương đến bạn "I luv you <3"`;
      //     console.log(message);
      //    //await _smsService.sendSms(result.customer.phoneNumber, message)
      // }
    } catch (err) {
      console.log(err)
      res.status(400).json(err);
    }
  }
);

router.put("/:id", auth.isStaff, async (req, res) => {
  try {
    const appointment = {
      appointmentTypeId: req.body.appointmentTypeId,
      staffId: req.body.staffId,
      customerId: req.body.customerId,
      date: new Date(req.body.date),
    };
    const appointmentType = await _appointmentService.getAppointmentTypeById(
      appointment.appointmentTypeId
    );
    const staff = await _userService.getUserById(
      appointment.staffId,
      userRole.Staff
    );
    const customer = await _userService.getUserById(
      appointment.customerId,
      userRole.Customer
    );

    if (appointmentType == null || staff == null || customer == null)
      return res.status(400).json("Something was wrong.");
    const result = await _appointmentService.createAppointment(appointment);

    // if(result) {
    //     var message = `Xin chào ${result.customer.name}\nNguyễn Anh Vy muốn gửi lời yêu thương đến bạn "I luv you <3"`;
    //     console.log(message);
    //    //await _smsService.sendSms(result.customer.phoneNumber, message)
    // }
    return res.status(200).json(result);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/type", auth.isAdmin, async (req, res) => {
  const typeName = req.body.name;
  if (typeName.trim().length == 0) return res.status(400);
  const result = await _appointmentService.createAppointmentType(typeName);
  return res.status(200).json(result);
});
router.delete("/:id",auth.isAdmin,async(req,res)=>{
  var id = req.params.id;
  var appointment = await _appointmentService.getAppointmentById(id)
  console.log(appointment)
  if(appointment === null){
    return res.status(404).json(false);
  }
  await _appointmentService.deleteAppointment(id)
  return res.status(200).json(true);
})
module.exports = router;
