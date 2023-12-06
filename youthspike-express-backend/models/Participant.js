const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// First Name, Last Name, birthday (age) Phone # and city 
const participantSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: String,
    cell: String,
    birthdate: String,
    payment_amount: String,
    payment_method: String,
    city: {
        type: String,
        required: true
    },
    event: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'event'
    }
});



/*
"firstname": "Vance",
"lastname": "Shurtliff",
"email": "vshurtliff@hotmail.com",
"mobilenumber": "+12085208974",
"smsopt-in": "NO",
"gender": "Male",
"birthdate": "05/18/1983",
"membershiplevel": "",
"membershipexpirationdate": "",
"discountcode": "",
"totalamount": "17.0",
"amountpaid": "17.0",
"outstandingbalance": "0.0",
"photo": "",
"opt-intonewsletter": "NO",
"registrationdate": "08/05/2021",
"waiveracceptancedate": "08/05/2021",
"status": "Spot Reserved",
"payment": "Paid",
"role": "Individual",
"originalrole": "Individual",
"smallgroup": "",
"team": "",
"teamnotes": "",
"address": "4301 Nottingham lane",
"city": "Idaho Falls",
"state": "ID",
"zip": "83402",
"emergencycontactname": "",
"emergencycontactnumber": "",
"notes": ""
*/







module.exports = mongoose.model('participant', participantSchema);