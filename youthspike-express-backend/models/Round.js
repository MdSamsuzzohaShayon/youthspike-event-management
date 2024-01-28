const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const roundSchema = new Schema({
    no: {
        type: Number,
        required: true
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'event',
        required: true
    }
    ,
    performances: [
        {
            type: Schema.Types.ObjectId,
            ref: 'performance'
        }
    ],
    nets: [
        {
            type: Schema.Types.ObjectId,
            ref: 'net'
        }
    ],
    left: [
        {
            type: Schema.Types.ObjectId,
            ref: 'performance'
        }
    ]
});
module.exports = mongoose.model('round', roundSchema);