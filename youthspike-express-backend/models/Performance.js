// https://mongoosejs.com/docs/subdocs.html
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scoreSchema = new Schema({
    score: { type: Number, default: 0 },
    point: { type: Number, default: 0 },
    pointDeferential: { type: Number, default: 0 },
});





scoreSchema.pre('validate', function (next) {
    // console.log('Child - 2');
    next();
});

scoreSchema.pre('save', function (next) {
    // console.log('child - 3');
    next();
});

const performanceSchema = new Schema({
    participant: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "participant"
    },
    event: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'event'
    },
    game1: scoreSchema,
    game2: scoreSchema,
    game3: scoreSchema,
    game4: scoreSchema,
    game5: scoreSchema,
    game6: scoreSchema,
    game7: scoreSchema,
    game8: scoreSchema,
    game9: scoreSchema,
    game10: scoreSchema,
    game11: scoreSchema,
    game12: scoreSchema,
    game13: scoreSchema,
    game14: scoreSchema,
    game15: scoreSchema,
    // nog = NUMBER OF GAME 
    nog: {
        type: Number,
        default: 1,
        max: 15,
        min: 1
    },
    pre_rank: {
        type: Number,
        default: 0,
    }
    // nested: {
    //     stuff: {
    //         type: String,
    //         lowercase: true,
    //         trim: true
    //     }
    // },
});

performanceSchema.pre('validate', function (next) {
    // console.log('parent - 1');
    next();
});

performanceSchema.pre('save', function (next) {
    // console.log('parent - 4');
    next();
});


module.exports = mongoose.model('performance', performanceSchema);