// https://mongoosejs.com/docs/populate.html
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const eventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: () => Date.now() 
    },
    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: 'participant',
            required: true
        }
    ]
});



module.exports = mongoose.model('event', eventSchema);