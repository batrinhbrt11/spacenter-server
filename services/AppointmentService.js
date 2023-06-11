const AppointmentType = require("../mongoose-entities/AppointmentType");
const Appointment = require("../mongoose-entities/Appointment");
const mongoose = require("mongoose");
const _userService = require("../services/UserService");
const { AddressInstance } = require("twilio/lib/rest/api/v2010/account/address");

const getAppointmentTypeById = async (id) => {
  var appointmentType = await AppointmentType.findById(id);
  return appointmentType;
};

const getAllAppointmentTypes = async () => {
  var appointmentTypes = await AppointmentType.find();
  return appointmentTypes;
};

const getAppointmentById = async (appointmentId) => {
    const appointment =  await Appointment.aggregate([
        {
          $lookup: {
            from: "appointmenttypes",
            localField: "appointmentTypeId",
            foreignField: "_id",
            as: "appointmentType",
          }
        },
        { $unwind: "$appointmentType" },
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
            $lookup: {
              from: "users",
              localField: "staffId",
              foreignField: "_id",
              as: "staff",
            },
            
        },
        { $unwind: "$staff" },
        {   
            $project:{
                _id : 1,
                appointmentType : "$appointmentType",
                customer : "$customer",
                staff: "$staff",
                updatedAt: 1
            }
        },
        { $match: { _id: mongoose.Types.ObjectId(appointmentId) } }
    ]);
  return appointment[0];
};

const getAllAppointments = async () => {
  var appointments = await Appointment.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "appointmenttypes",
        localField: "appointmentTypeId",
        foreignField: "_id",
        as: "appointmentType",
      },
    },
    { $unwind: "$appointmentType" },
    {
      $lookup: {
        from: "users",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: {path:"$customer",preserveNullAndEmptyArrays: true}  },
    {
      $lookup: {
        from: "users",
        localField: "staffId",
        foreignField: "_id",
        as: "staff",
      },
    },
    { $unwind: "$staff" },
    {
      $project: {
        _id: 1,
        customerName: 1,
        phoneNumber: 1,
        customerId:1,
        appointmentType: "$appointmentType",
        customer:{ '$ifNull': ["$customer", "NULL"] },
        staff: "$staff",
        date: 1,
        updatedAt: 1,
      },
    },
  ]);
 
  return appointments;
};

createAppointment = async (appointment) => {
  var newAppointment = new Appointment({
    customerId: appointment.customerId,
    staffId: appointment.staffId,
    appointmentTypeId: appointment.appointmentTypeId,
    date: appointment.date,
  });
  var result = await newAppointment.save();
  if (result) return await getAppointmentById(result._id);
  return null;
};
createAppointmentWithOutCustomerId = async (appointment) => {
  var newAppointment = new Appointment({
    customerId:null,
    phoneNumber: appointment.phoneNumber,
    customerName: appointment.customerName,
    staffId: appointment.staffId,
    appointmentTypeId: appointment.appointmentTypeId,
    date: appointment.date,
  });
  var result = await newAppointment.save();
  if (result) return await getById(result._id);
  return null;
};
createAppointmentType = async (typeName) => {
  var newAppointmentType = new AppointmentType({
    name: typeName,
  });
  await newAppointmentType.save();
  return newAppointmentType;
};

updateAppointment = async (appointment) => {
  return await appointment.save();
};

updateAppointmentType = async (appointmentType) => {
  return await appointmentType.save();
};

deleteAppointment = async (appointmentId) => {
  return await Appointment.findByIdAndDelete(appointmentId);
};

deleteAppointmentType = async (appointmentTypeId) => {
  return await AppointmentType.findByIdAndDelete(appointmentTypeId);
};

getAppointmentsByTypeId = async (typeId) => {
  var appointments = await getAllAppointments();
  appointments = appointments.filter((a) =>
    a.appointmentType._id.equals(typeId)
  );
  return appointments;
};

const deleteAppointmentByTypeId = async (typeId) => {
  await Appointment.deleteMany({ appointmentTypeId: typeId });
};


const isCustomerBookThisTime = async(id,phoneNumber, time) => {
  let appointments = []
  if(phoneNumber === ""){
    appointments = await Appointment.find({ customerId: id});
  
  }else{
    appointments = await Appointment.find({phoneNumber:phoneNumber})
  }
  var count = 0;
  appointments.forEach(a => {
    if ((a.date.getTime() >= (time - 59*60*1000) && a.date.getTime() <= time) ||
     (a.date.getTime() <= (time + 59*60*1000) && a.date.getTime() >= time)){
      count += 1;
    }
  })
  if(count > 0){
    return true;
  }
  return false;
}

module.exports = {
  getAppointmentTypeById,
  getAllAppointmentTypes,
  getAllAppointments,
  getAppointmentById,
  createAppointmentType,
  createAppointment,
  createAppointmentWithOutCustomerId,
  updateAppointment,
  updateAppointmentType,
  deleteAppointment,
  deleteAppointmentType,
  getAppointmentsByTypeId,
  deleteAppointmentByTypeId,
  isCustomerBookThisTime
};
