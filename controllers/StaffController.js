const router = require("express").Router();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const userService = require("../services/UserService.js");
const userRole = require("../models/Role.js");
const auth = require("../middlewares/auth.js");
const { route } = require("./AppointmentController.js");
const { response } = require("express");
dotenv.config();


router.post('/', auth.isAdmin, async (req, res) => {
    var newStaff = {
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        birth: req.body.birth,
        email:req.body.email,
        username: req.body.username,
        password: req.body.password,
        role: userRole.Staff
    }
    var existingAccount = await userService.getByUserName(req.body.username);
    if (existingAccount != null)  return res.status(400).json({ message: "Username is existing"});
    var result  = await userService.create(newStaff);
    if(!result) 
        return res.status(400).json(result);
    return res.status(200).json(result);
})

router.get('/', async (req, res) => {
    var staffs = await userService.getAllUsers(userRole.Staff);
    return res.status(200).json(staffs);
})

router.get('/:id', auth.isAdmin, async (req, res) => {
    var id = req.params.id;
    if(req.role == userRole.Staff &&  id != req.user._id) {
        return res.status(403).json("You do not have permission.");
    }
    var staff = await userService.getUserById(id, userRole.Staff);
    return res.status(200).json(staff);
})

router.put('/:id', auth.isStaff, async (req, res) => {
    var id = req.params.id;
    var staff = await userService.getUserById(id, userRole.Staff);
    if(req.role == userRole.Staff && req.user._id != staff._id){
        res.status(403).json(`You do not have permission.`);
    }
    if (staff == null){
        res.status(404).json(`Not found the staff with id is ${id}`);
    }
    var updatedStaff = {
        _id: id,
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        birth: req.body.birth,
        email:req.body.email
    }

    var result = await userService.updateUser(updatedStaff);
    return res.status(200).json(result);
})

router.delete('/:id', auth.isAdmin, async (req, res) => {
    var id = req.params.id;
    var staff = await userService.getUserById(id, userRole.Staff);
    if (staff == null){
        return res.status(404).json("Staff not found");
    }
    await userService.deleteUser(id);
    return res.status(200).json(true);
})

module.exports = router;