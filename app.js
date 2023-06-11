const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const PORT = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

const _messageService = require("./services/MessageService");
const _userService = require("./services/UserService");
const userRole = require("./models/Role");
//controllers
const accountController = require("./controllers/AccountController");
const appointmentController = require("./controllers/AppointmentController");
const customerController = require("./controllers/CustomerController");
const voucherController = require("./controllers/VoucherController");
const customerVoucherController = require("./controllers/CustomerVoucherController");
const messageController = require("./controllers/MessageController");
const staffController = require("./controllers/StaffController");
const appointmentTypeController = require("./controllers/AppointmentTypeController");
const socketio = require("socket.io");
const app = express();
dotenv.config();

mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, client) => {
    if (err) console.log(err);
    else console.log("Connected to MongoDB");
  }
);

//middleware
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/user", accountController);
app.use("/api/appointment", appointmentController);
app.use("/api/customer", customerController);
app.use("/api/voucher", voucherController);
app.use("/api/customervoucher", customerVoucherController);
app.use("/api/message", messageController);
app.use("/api/staff", staffController);
app.use("/api/appointmenttype", appointmentTypeController);

const server = app.listen(PORT, () => {
  console.log("server is running 5000");
});

//Socket.io
const io = socketio(server);
var onlineUsers = [];

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;
    console.log(token);
    await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
      if (err) {
        return;
      } else {
        const user = await _userService.getByUserName(data.username);
        socket.id = user._id.toString().replace(/ObjectId\("(.*)"\)/, "$1");
        socket.role = user.role;
        var isExisting = onlineUsers.filter(x => x.id == socket.id);
        console.log("isExisting", isExisting);
        if(isExisting.length == 0){
          onlineUsers.push({ id: user._id.toString().replace(/ObjectId\("(.*)"\)/, "$1"), role: user.role});
        }
        next();
      }
    });
  } catch (err) {
    console.log(err);
  }
});

io.on("connection", async (socket) => {
  var messages = [];
  console.log(`${socket.id} connected`);
  var id = socket.id;
  console.log(socket.id)
  if (socket.role == userRole.Customer){
    messages = await _messageService.getMessagesByUserId(socket.id);
    console.log("addm")
    messages.forEach(msg => {
      msg.unreadMsg = 0;
      if (msg.messageDetails.length > 0){
        msg.unreadMsg = msg.messageDetails.filter(x => x.isRead == false && x.userId != id).length;
      }
    })
  }
  else{
    messages = await _messageService.getAllMessages();
    for (var i = 0; i < messages.length; i++){
      var count = 0;
      messages[i].messageDetails.forEach(d => {
          if (d.isRead == false && d.userId != messages[i].customerId){
              count += 1;
          } 
      })       
      messages[i].unreadMsg = count;

    }
  }
  io.to(socket.id).emit('userMessages', messages);
  // socket.on('userConnected', async () => {
  //   socket.join(socket.id);
  //   var messages = null;
  //   if (socket.role == userRole.Customer){
  //     messages = await _messageService.getMessagesByUserId(socket.id);
  //   }
  //   else{
  //     messages = await _messageService.getAllMessages();
  //   }
  //   console.log(messages);
  //   socket.to(socket.id).emit('userMessages', messages);
  // })

  socket.on("sendMessage", async ({ userId, msg }) => {
    console.log(id, " sent");
    var customerId = null;
    if (socket.role != userRole.Customer){
      var user = await _userService.getById(userId);
      if (userId == id ){
        console.log("Error: Cannot send to yourself");
        return;
      }
      if (user == null){
        console.log("User not found");
        return;
      }
      customerId = userId;
    }
    else{
      customerId = id;
    }
    var messageRoom = await _messageService.getMessageByUserId(customerId);
    if (messageRoom == null) {
      await _messageService.createMessage(customerId);
    }

    messageRoom = await _messageService.getMessageByUserId(customerId);
    var newMessage = {
      content: msg,
      userId: id,
      messageId: messageRoom._id,
      createdAt: new Date()
    };
    var msgDetail = await _messageService.sendMessage(newMessage);
    console.log(msgDetail);
    if (socket.role == userRole.Customer){
      messages = await getMessages(id, userRole.Customer);
      onlineUsers.forEach(async x => {
        if ((x.role === userRole.Staff) || x.role === userRole.Admin){
          console.log(socket.role, "messages: ", messages);
          io.to(x.id).emit("newMessage", messages);
        }
      }) 
    } 
    else{
      messages = await getMessages(userId, userRole.Admin);
      io.to(userId).emit('newMessage', messages);
      socketMessages = await _messageService.getAllMessages();
      for (var i = 0; i < socketMessages.length; i++){
        var count = 0;
        onlineUsers.forEach(async x => {
          socketMessages[i].messageDetails.forEach(d => {
              if (d.isRead == false && d.userId == socketMessages[i].customerId){
                  count += 1;
              } 
          })       
          socketMessages[i].unreadMsg = count;
          if (x.role == userRole.Admin || x.role == userRole.Staff)
            io.to(x.id).emit('userMessages', socketMessages);  
        }) 
      }
    }
  });


  socket.on("readMessages", async (customerId) => {
    if (socket.role == userRole.Customer){
      await _messageService.readMessages(id);
      messages = await _messageService.getMessagesByUserId(socket.id);
      messages.forEach(msg => {
        msg.unreadMsg = 0;
        if (msg.messageDetails.length > 0){
          msg.unreadMsg = msg.messageDetails.filter(x => x.isRead == false && x.userId != id).length;
        }
      })
    }
    else {
      await _messageService.readMessages(customerId);
      messages = await _messageService.getAllMessages();
      for (var i = 0; i < messages.length; i++){
        var count = 0;
        messages[i].messageDetails.forEach(d => {
            if (d.isRead == false && d.userId != messages[i].customerId){
                count += 1;
            } 
        })       
        messages[i].unreadMsg = count;
      }
    }
    io.to(id).emit('userMessages', messages);  
    console.log("user read");
  })

  socket.on("disconnect", (socket) => {
    console.log(`${id} disconnected`);
    if (onlineUsers.length > 0){
      onlineUsers = onlineUsers.filter(x => x.id != id);
    }
  });
});

const getMessages = async (customerId, role) => {
  var msgs = [];
  if (role == userRole.Customer){
    msgs = await _messageService.getAllMessages();
    for (var i = 0; i < msgs.length; i++){
      var count = 0;
      msgs[i].messageDetails.forEach(d => {
          if (d.isRead == false && d.userId != msgs[i].message.customerId){
              count += 1;
          } 
      })       
      console.log(count);
      msgs[i].unreadMsg = count;
    }
  }
  else{
    msgs = await _messageService.getMessagesByUserId(customerId);
    for (var i = 0; i < msgs.length; i++){
      var count = 0;
      msgs[i].messageDetails.forEach(d => {
          if (d.isRead == false && d.userId != customerId){
              count += 1;
          } 
      })       
      msgs[i].unreadMsg = count;
    }
  }
  return msgs;
}