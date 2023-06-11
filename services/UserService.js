const Account = require("../mongoose-entities/Account");
const bcrypt = require("bcrypt");
const User = require("../mongoose-entities/User");
const userRole = require("../models/Role");
const mongoose = require("mongoose");
const Appointment = require("../mongoose-entities/Appointment");

authenticate = async (username, password, roles) => {
  const existingAccount = await Account.findOne({ username: username }).exec();
  if (existingAccount == null) {
    return -1;
  }
  const validPassword = await bcrypt.compare(
    password,
    existingAccount.password
  );
  if (!validPassword) {
    return -1;
  }
  if (roles.includes(existingAccount.role)) return 1;
  return 0;
};

create = async (newUser) => {
  var salt = await bcrypt.genSalt(10);
  var hashedPassword = await bcrypt.hash(newUser.password, salt);
  var newAccount = new Account({
    username: newUser.username,
    password: hashedPassword,
    role: newUser.role,
  });
  await newAccount.save(async (err, data) => {
    if (err) return false;
    else {
      var user = new User({
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        birth: new Date(newUser.birth),
        accountId: data._id,
        email: newUser.email,
      });
      await user.save((err, data) => console.log(data));
    }
  });

  return true;
};

getAllUsers = async (userRole) => {
  var customers = await User.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
      },
    },
    { $unwind: "$account" },
    {
      $project: {
        name: 1,
        phoneNumber: 1,
        birth: 1,
        email:1,
        username: "$account.username",
        createdAt: 1,
        updatedAt: 1,
        role: "$account.role",
      },
    },
    {
      $match: {
        role: userRole,
      },
    },
  ]);
  return customers;
};

getCustomersHasBirthDay = async () => {
    var birthCustomers = [];
    var now = new Date();
    var customers = await getAllUsers(userRole.Customer);
    customers.forEach(c => {
        let day = c.birth.getDate();
        let month = c.birth.getMonth();
        if ( now.getDate() == day && now.getMonth() == month){
            birthCustomers.push(c);
        }
        return birthCustomers;
    });  
}


getUserById = async (id, role) => {
  var user = await User.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
      },
    },
    { $unwind: "$account" },
    {
      $project: {
        _id: 1,
        name: 1,
        phoneNumber: 1,
        birth: 1,
        email:1,
        username: "$account.username",
        createdAt: 1,
        updatedAt: 1,
        role: "$account.role",
      },
    },
    {
      $match: {
        $and: [{ role: role }, { _id: mongoose.Types.ObjectId(id) }],
      },
    },
  ]);
  return user[0];
};

getById = async (id) => {
    var user = await User.aggregate([
        {
          $lookup: {
            from: "accounts",
            localField: "accountId",
            foreignField: "_id",
            as: "account",
          }
        },
        { $unwind: "$account" },
        {   
            $project:{
                _id : 1,
                name : 1,
                birth : 1,
                phoneNumber : 1,
                date: 1,
                email:1,
                username : "$account.username",
                gender: 1,
                role: "$account.role",
                createdAt: 1,
                updatedAt: 1
            } 
        },
        { $match: { _id: mongoose.Types.ObjectId(id) }}
    ]);
    return user[0];
}

getByUserName = async (userName) => {
    var user = await User.aggregate([
        {
          $lookup: {
            from: "accounts",
            localField: "accountId",
            foreignField: "_id",
            as: "account",
          }
        },
        { $unwind: "$account" },
        {   
            $project:{
                _id : 1,
                name : 1,
                birth : 1,
                phoneNumber : 1,
                email:1,
                username : "$account.username",
                role: "$account.role",
                createdAt: 1,
                updatedAt: 1
            } 
        },
        { $match: { username: userName }}
    ]);
    // // var account = await Account.findOne({ username: userName });
    // // var user = await User.findOne({ accountId: account._id });
    // // return {
    // //     _id : user._id,
    // //     name : user.name,
    // //     birth : user.birth,
    // //     phoneNumber : user.phoneNumber,
    // //     username : account.username,
    // //     role: account.role,
    // //     createdAt: 1,
    // //     updatedAt: 1
    // // };
    return user[0];
}

updateUser = async (user) => {
  var result = await User.findByIdAndUpdate(user._id, {
    name: user.name,
    phoneNumber:user.phoneNumber,
    birth: user.birth,
    gender: user.gender,
    email:user.email,
  },{returnOriginal: false});
  return result;
};

deleteUser = async (id) => {
  var user = await User.findById(id);
  await User.findByIdAndDelete(id);
  await Account.findByIdAndDelete(user.accountId);
};

changePassword = async (username, newPassword) => {
  var salt = await bcrypt.genSalt(10);
  var hashedPassword = await bcrypt.hash(newPassword, salt);
  await Account.findOneAndUpdate({ username: username }, { password: hashedPassword });
}

getAvailableStaffAtTime = async (time) => {
  var users = await getAllUsers(userRole.Staff);
  var availableStaffs = [];
  for(var i = 0; i < users.length; i++){
    users[i].appointments = await Appointment.find({ staffId: users[i]._id});
    console.log(users[i].appointments);
    var count = 0;
    if (users[i].appointments.length == 0){
      availableStaffs.push(users[i]);
    }
    else{
      users[i].appointments.forEach(a => {
        if ((a.date.getTime() >= (time - 59*60*1000) && a.date.getTime() <= time) ||
        (a.date.getTime() <= (time + 59*60*1000) && a.date.getTime() >= time)){
          count += 1;
        }
      })
      if (count == 0){
        availableStaffs.push(users[i]);
      }
    }
  }
  return availableStaffs;
}

module.exports = {
  authenticate,
  create,
  getById,
  getUserById,
  getByUserName,
  deleteUser,
  getAllUsers,
  getCustomersHasBirthDay,
  updateUser,
  changePassword,
  getAvailableStaffAtTime
}
