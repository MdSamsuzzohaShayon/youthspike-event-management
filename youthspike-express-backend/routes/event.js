const express = require('express');
const { check, validationResult } = require('express-validator');

const Event = require('../models/Event');
const Net = require('../models/Net');
const Performance = require('../models/Performance');
const Round = require('../models/Round');
const Participant = require('../models/Participant');


const { ensureAuth, ensureGuast } = require('../config/auth');

const router = express.Router();
// arr[Math.floor(Math.random() * arr.length)];





/* ⛏️⛏️ CREATE AN EVENT ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖  */
router.post('/',
    ensureAuth,
    check('title', "Title must not empty and a valid email").notEmpty(),
    (req, res, next) => {
        const valErrs = validationResult(req);
        if (!valErrs.isEmpty()) {
            return res.status(400).json({ errors: valErrs.errors });
        } else {
            // console.log(req.body);
            Event.create({
                title: req.body.title,
                date: req.body.date,
            }, (err, docs) => {
                res.status(200).json({ request: 'Success', event: docs });
                // console.log(docs);
            });
        }
    });







// ⛏️⛏️ GET ALL EVENT ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖  
router.get('/', async (req, res, next) => {
    try {
        const docs = await Event.find();
        // console.log("Get all events");
        // console.log(docs);
        res.status(200).json({ msg: 'Get All Events', events: docs });
    } catch (error) {
        res.json(error);
    }
});





// ⛏️⛏️ GET SINGLE EVENT ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖  
router.get('/:id', async (req, res, next) => {
    try {
        const event = await Event.findById({ _id: req.params.id }).populate('participants').exec();
        // Story.find().populate({ path: 'fans', select: 'name' }).populate({ path: 'fans', select: 'email' });
        res.status(200).json({ msg: 'Get Single Events', events: event });
    } catch (error) {
        res.json(error);
    }
});




/* ⛏️⛏️ DELETE AN EVENT ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖  */
router.delete('/:id', ensureAuth, async (req, res, next) => {
    try {
        const event = await Event.findByIdAndDelete({ _id: req.params.id });
        const participant = await Participant.deleteMany({ _id: { $in: event.participants } });
        // console.log("Deleted participant - ", participant);
        const performance = await Performance.deleteMany({ event: req.params.id });
        const net = await Net.deleteMany({ event: req.params.id });
        const round = await Round.deleteMany({ event: req.params.id });
        res.status(200).json({ msg: 'Event deleted', event, participant, performance, net });
    } catch (error) {
        console.log(error)
    }
});















module.exports = router;