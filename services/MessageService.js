const Account = require("../mongoose-entities/Account");
const User = require("../mongoose-entities/User");
const Message = require("../mongoose-entities/Message");
const MessageDetail = require("../mongoose-entities/MessageDetail");
const { MessageInstance } = require("twilio/lib/rest/api/v2010/account/message");
const mongoose = require("mongoose");

const sendMessage = async (message) => {
    var newMessageDetail = new MessageDetail({
        content: message.content,
        userId: message.userId,
        messageId: message.messageId
    });
    newMessageDetail = await newMessageDetail.save();
    return newMessageDetail;
}

const getMessagesByUserId = async (userId) => {
    var messages = await User.aggregate([
        {
            $lookup: {
              from: "messages",
              localField: "_id",
              foreignField: "customerId",
              as: "message",
            },
        },
        { $unwind: "$message" },
        {   
            $project:{
                _id : 1,
                name : 1,
                message : "$message",
            } 
        },
        { $match: { _id: mongoose.Types.ObjectId(userId) } }
    ]);

    if (messages.length > 0){
        messages[0].messageDetails = [];
        messages[0].messageDetails = await MessageDetail.aggregate([
            {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "user",
                },
            },
            { $unwind: "$user" },
            {   
                
                $project:{
                    content: 1,
                    messageId: 1,
                    userId: 1,
                    name: "$user.name",
                    isRead: 1,
                    createdAt: 1
                } 
            },
            { $match: { messageId: mongoose.Types.ObjectId(messages[0].message._id)} },
            {$sort: { createdAt: 1}}
        ]);
    }
    return messages;
}
// {messages[0].messageDetails.map((msg, index) => {
//     if (msg.userId === userId){(
//       <MyMessage>
//         <MessageBox style={{ backgroundColor: "#f9a392" }}>
//           <p>{ msg.content }</p>
//         </MessageBox>
//       </MyMessage>
//     )}
//     else {(
//       <AdminMessage>
//         <MessageBox>
//           <p style={{ color: "#000" }}>
//           { msg.content }
//           </p>
//         </MessageBox>
//       </AdminMessage>
//     )}
//   })}   

const getAllMessages = async () => {
    var messages = await User.aggregate([
        {
            $lookup: {
              from: "messages",
              localField: "_id",
              foreignField: "customerId",
              as: "message",
            },
        },
        { $unwind: "$message" },
        {   
            $project:{
                _id : 1,
                name : 1,
                message : "$message",
            } 
        }    
    ]);

    if (messages.length > 0){
        for (var i = 0; i < messages.length; i++){
            messages[i].messageDetails = [];
            messages[i].messageDetails = await MessageDetail.aggregate([
                {
                    $lookup: {
                      from: "users",
                      localField: "userId",
                      foreignField: "_id",
                      as: "user",
                    },
                },
                { $unwind: "$user" },
                {   
                    $project:{
                        content: 1,
                        messageId: 1,
                        userId: 1,
                        name: "$user.name",
                        isRead: 1,
                        createdAt: 1
                    } 
                },
                { $match: { messageId: messages[i].message._id} },
                {$sort: { createdAt: 1}}
            ]);
        }   
    }
    return messages;
}

const getMessageByUserId = async (userId) => {
    var message = await Message.findOne({customerId: userId});
    return message;
}

const createMessage = async (customerId) => {
    var newMessage = new Message({
        customerId: customerId,
    });
    await newMessage.save();
    console.log(newMessage);
    return newMessage;
}

const readMessages = async (customerId) => {
    var message = await Message.findOne({ customerId: customerId});
    if (message != null){
        await MessageDetail.updateMany({ messageId: message._id}, {"$set":{isRead: true}});
    }
}

module.exports = {
    sendMessage,
    getMessagesByUserId,
    getAllMessages,
    getMessageByUserId,
    createMessage,
    readMessages
}