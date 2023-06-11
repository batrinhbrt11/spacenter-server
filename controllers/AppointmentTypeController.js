const router = require("express").Router();
const auth = require("../middlewares/auth");
const _appointmentService = require("../services/AppointmentService");
const _smsService = require("../services/SmsService");
const _userService = require("../services/UserService");

router.get('/', async (req, res) => {
    const appointments = await _appointmentService.getAllAppointmentTypes();
    return res.status(200).json(appointments);
});

router.get('/:id',auth.isStaff, async (req, res) => {
    var typeId = req.params.id;
    const appointmentType = await _appointmentService.getAppointmentTypeById(typeId);
    return res.status(200).json(appointmentType);
});

router.post('/', auth.isStaff, async (req, res) => {
    try 
    {
        const typeName = req.body.name;
        if (typeName.trim().length == 0) return res.status(400);
        const result = await _appointmentService.createAppointmentType(typeName);
        return res.status(200).json(result);
    }
    catch(err) 
    {
        res.status(400).json(err);
    }
});

router.put('/:id', auth.isStaff, async (req, res) => {
    try 
    {
        var id = req.params.id;
        var name = req.body.name;
        const appointmentType = await _appointmentService.getAppointmentTypeById(id);
        if (appointmentType == null)
            return res.status(404).json("Appointment type not found");
        appointmentType.name = name;
        var result = await _appointmentService.updateAppointmentType(appointmentType);    
        // if(result) {
        //     var message = `Xin chào ${result.customer.name}\nNguyễn Anh Vy muốn gửi lời yêu thương đến bạn "I luv you <3"`;
        //     console.log(message);
        //    //await _smsService.sendSms(result.customer.phoneNumber, message)
        // }
        return res.status(200).json(result);
    }
    catch(err) 
    {
        res.status(400).json(err);
    }
});

router.delete('/:id', auth.isStaff, async (req, res) => {
    try 
    {
        var id = req.params.id;
        const appointmentType = await _appointmentService.getAppointmentTypeById(id);

        if (appointmentType == null)
            return res.status(404).json("Appointment type not found");

        var appointments = await _appointmentService.getAppointmentsByTypeId(id);  
        if(appointments.length > 0){
            appointments = appointments.filter(a => a.date.getTime() >= new Date().getTime());
            if ( appointments.length > 0){
                return res.status(400).json("Can not delete because we have appointments which are using this appointment type.");
            }
            await _appointmentService.deleteAppointmentType(id);
            await _appointmentService.deleteAppointmentByTypeId(id);
            return res.status(200).json(true);
        }
        // if(result) {
        //     var message = `Xin chào ${result.customer.name}\nNguyễn Anh Vy muốn gửi lời yêu thương đến bạn "I luv you <3"`;
        //     console.log(message);
        //    //await _smsService.sendSms(result.customer.phoneNumber, message)
        // }
        await _appointmentService.deleteAppointmentType(id);
        await _appointmentService.deleteAppointmentByTypeId(id);
        return res.status(200).json(true);
    }
    catch(err) 
    {
        console.log(err)
        res.status(400).json(err);
    }
});

module.exports = router;