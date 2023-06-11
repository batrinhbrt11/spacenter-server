const dotenv = require("dotenv");
dotenv.config();
const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function sendSms (number, message) {
    number = number.replace('0', '+84');
    twilio.messages.create({
        body: message,
        to: number,
        from: process.env.PHONE_NUMBER
    })
    .then(msg => console.log(msg))
    .catch(err => console.log(err));
}

function verifyNumber (name, number) {
    number = number.replace('0', '+84');
    twilio.validationRequests
    .create({friendlyName: name, phoneNumber: number})
    .then(validation_request => console.log(validation_request.friendlyName))
    .catch(err => console.log(err));
}
module.exports = { sendSms, verifyNumber };