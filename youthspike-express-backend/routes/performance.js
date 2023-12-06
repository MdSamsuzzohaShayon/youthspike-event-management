const express = require('express');
const formidable = require('formidable');
const csv = require('csvtojson');
// const fsPromise = require('fs').promises;
const fs = require('fs');
const path = require('path');
// Require library
const xl = require('excel4node');
const { SUPER, GENERAL } = require('../utils/Role');




const Event = require('../models/Event');
const Participant = require('../models/Participant');
const Performance = require('../models/Performance');
const Net = require('../models/Net');


const { check, validationResult } = require('express-validator');

const { wholeRanking } = require('../utils/ranking');
const { updatedPerformance, updateOnlyPoint, getScoreFromDoc } = require('../utils/updatedPerformance');
const { replaceKeys } = require('../utils/helpers');
const { ensureAuth, ensureGuast } = require('../config/auth');
const excelCell = require('../utils/excelCell');


const router = express.Router();





// router.get('/findteam', async (req, res, next) => {
//     //         // const { player1, player2 } = req.body;
//     //         // // [0]['61750e90f27635275693d7cc', '61750e90f27635275693d7d2']
//     //         // // [0]['61750e90f27635275693d7cd', '61750e90f27635275693d7d1']
//     //         // console.log(req.body);

//     const performance1 = await Performance.findById('61750e90f27635275693d7cc').populate({ path: "participant", select: "firstname lastname" });
//     const performance2 = await Performance.findById('61750e90f27635275693d7d2').populate({ path: "participant", select: "firstname lastname" });
//     res.status(200).json({ request: 'Success', performance1, performance2 });
// });


router.get('/:eventID', async (req, res, next) => {
    const allPerformance = await Performance.find({ event: req.params.eventID }).populate({ path: "participant", select: "firstname lastname" });
    res.status(200).json({ performances: allPerformance });
});







/* ⛏️⛏️ CREATE PARTICIPANT OR PERFORMANCE ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖  */
router.post('/:eventID',
    ensureAuth,
    check('firstname', "Firstname must not empty").notEmpty(),
    check('lastname', "Lastname must not empty").notEmpty(),
    check('city', "City must not empty").notEmpty(),
    async (req, res, next) => {
        const valErrs = validationResult(req);

        // console.log(req.body);
        if (!valErrs.isEmpty()) {
            console.log(valErrs);
            return res.status(400).json({ errors: valErrs.errors });
        } else {
            try {

                const { firstname, lastname, email, cell, birthdate, city, payment_amount, payment_method } = req.body;
                const new_participant = new Participant({
                    firstname,
                    lastname,
                    email,
                    cell,
                    birthdate,
                    city,
                    payment_amount,
                    payment_method,
                    event: req.params.eventID
                });

                const participant = await new_participant.save();
                const event = await Event.findByIdAndUpdate({ _id: req.params.eventID }, { $push: { participants: participant._id } }, { new: true });
                const new_performance = new Performance({
                    participant: participant._id,
                    event: req.params.eventID
                });

                const performance = await new_performance.save();

                res.status(200).json({ msg: 'Create partipipant and referancing to event', participant, performance });
            } catch (error) {
                res.json(error);
            }
        }
    });















/* ⛏️⛏️ CREATE MULTIPLE PARTICIPANT ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖  */
router.post('/multiple/:eventID', ensureAuth, (req, res, next) => {


    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }


        csv()
            .fromFile(files.file.path)
            .then((jsonObj) => {
                // const exampleObj = {
                //     'First Name': 'Kaitlin',
                //     'Last Name': 'Ro',
                //     Email: 'kaitlinro1@gmail.com',
                //     'Mobile Number': '+12089714339',
                //     Gender: 'Female',
                //     Birthdate: '02/15/1995',
                //     'Total Amount': '12.0',
                //     'Outstanding Balance': '0.0',
                //     Status: 'Spot Reserved',
                //     Payment: 'Paid',
                //     City: 'Rexburg',
                // }


                // // console.log("JSON OBJECT");
                // console.log("JSON OBJECT - ", jsonObj);


                const errors = [];
                const allParticipant = [];
                let msg = null;
                for (let obj of jsonObj) {
                    const newParticipant = replaceKeys(obj, req.params.eventID);
                    if (newParticipant.firstname && newParticipant.lastname && newParticipant.city) {
                        allParticipant.push(newParticipant);
                    } else {
                        msg = "Some participant doesn't has firstname, lastname or city those are not included"
                        // errors.push({ errType: "missing_fields", msg: "Some participant doesn't has firstname, lastname or city those are not included" });
                    }
                }
                if (msg) errors.push({ msg });

                // console.log("All Participant - ", allParticipant);



                if (errors.length > 0) {
                    // console.log("No errors");
                    Participant.insertMany(allParticipant).then(function (participant) {
                        // console.log(allParticipant);
                        // console.log("Has errors");
                        // console.log("Data inserted", participant);  // Success
                        const performanceList = [];
                        for (let per of participant) {
                            performanceList.push({ participant: per._id, event: req.params.eventID });
                        }
                        // console.log("insert many performance - ");
                        Performance.insertMany(performanceList).then(p => {
                            console.log("Inserted all performance - ");
                        });

                        participant.forEach((p, i) => {
                            // console.log(p._id);
                            Event.findByIdAndUpdate({ _id: req.params.eventID }, { $push: { participants: p._id } }, { new: true }).then((data) => {
                                // console.log(data);
                            }).catch(eventErr => {
                                console.log(eventErr);
                            });
                        });



                        res.json({ errors, eventID: req.params.eventID, files: participant });
                    }).catch(function (error) {
                        console.log(error)      // Failure
                    });
                } else {
                    // console.log("Has errors");
                    Participant.insertMany(allParticipant).then(function (participant) {
                        // console.log(participant);
                        const performanceList = [];
                        for (let per of participant) {
                            performanceList.push({ participant: per._id, event: req.params.eventID });
                        }
                        // console.log("insert many performance - ");
                        Performance.insertMany(performanceList).then(p => {
                            console.log("Inserted all performance - ");
                        });
                        // console.log("Data inserted", participant)  // Success
                        participant.forEach((p, i) => {
                            Event.findByIdAndUpdate({ _id: req.params.eventID }, { $push: { participants: p._id } }, { new: true }).then((data) => {
                                // console.log(data);
                            }).catch(eventErr => {
                                console.log(eventErr);
                            });
                        });

                        res.json({ msg: "All participant added successfully", eventID: req.params.eventID, files: participant });
                    }).catch(function (error) {
                        console.log(error)      // Failure
                    });
                }


                // Function call
            });

    });

    // const newParticipant = new Participant({
    //     name: name,
    //     address: address
    // });
    // const participant = await newParticipant.save();
    // const event = await Event.findByIdAndUpdate({ _id: eventID }, { $push: { participants: participant._id } }, { new: true });
    // res.status(200).json({ msg: 'Create partipipant and referancing to event', participant, event });
});





// ⛏️⛏️ UPDATE ALL PERFORMANCE OF A ROUND ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ 
router.put('/update-performance/:eventID/:roundNum', ensureAuth, async (req, res, next) => {


    const { updateScore } = req.body;
    const { eventID } = req.params;
    const roundNum = parseInt(req.params.roundNum)
    // console.log("updateScore");
    // console.log(winningExtraPoint);


    updateScore.forEach(async (us, i) => {
        // console.log(us);

        try {
            // CHECK FOR ONLY UPDATE WINNING POINT - TEAM ONE, TWO IS NULL HERE 
            if (us.wp !== null && us.team1 === null && us.team2 === null && us.game === null) {



                const select = "participant net game1 game2 game3 game4 game5 game6 game7 game8 game9 game10 game11 game12 game13 game14 game15 pre_rank";
                const findNet = await Net.findOneAndUpdate({ _id: us.netID }, { wp: us.wp })
                    .populate({
                        path: "performance",
                        select,
                        populate: {
                            path: "participant",
                            select: "firstname lastname"
                        }
                    });

                await updateOnlyPoint(findNet, roundNum, us.wp);



            } else if (us.wp !== null && us.team1 !== null && us.team2 !== null && us.game !== null) {

                // WITH NET 
                let team1Score = us.team1.score, team2Score = us.team2.score;

                if (team1Score === null) {
                    const doc = await Performance.findById(us.team1.players[0]);
                    team1Score = getScoreFromDoc(us.game, doc);
                }
                if (team2Score === null) {
                    // FIND PREVIOUS ITEM AND UPDATE 
                    const doc = await Performance.findById(us.team2.players[0]);
                    team2Score = getScoreFromDoc(us.game, doc);
                }
                // console.log(team1Score);
                // console.log(team2Score);

                let t1pd = team1Score - team2Score;
                let t2pd = team2Score - team1Score;

                let t1p = 0, t2p = 0;
                if (t1pd > t2pd) {
                    t1p = us.wp;
                } else if (t1pd < t2pd) {
                    t2p = us.wp;
                }

                const netUpdate = await Net.findOneAndUpdate({ _id: us.netID }, { wp: us.wp });                                                                                                        //score, tp, tpd, gameSpec
                const updateTeam1 = await Performance.updateMany({ _id: { $in: us.team1.players } }, { $set: updatedPerformance(us, roundNum, team1Score, t1p, t1pd, us.netID) });
                const updateTeam2 = await Performance.updateMany({ _id: { $in: us.team2.players } }, { $set: updatedPerformance(us, roundNum, team2Score, t2p, t2pd, us.netID) });
            } else if (us.wp === null && us.team1 !== null && us.team2 !== null && us.game !== null) {
                // WITH NET 
                let team1Score = us.team1.score, team2Score = us.team2.score;

                if (team1Score === null) {
                    const doc = await Performance.findById(us.team1.players[0]);
                    team1Score = getScoreFromDoc(us.game, doc);
                }
                if (team2Score === null) {
                    // FIND PREVIOUS ITEM AND UPDATE 
                    const doc = await Performance.findById(us.team2.players[0]);
                    team2Score = getScoreFromDoc(us.game, doc);
                }
                const findNetPoint = await Net.findById(us.netID);

                let t1pd = team1Score - team2Score;
                let t2pd = team2Score - team1Score;
                // console.log(`t1 - ${us.team1.players} \n t2 - ${us.team2.players}`);
                // console.log(`${i}: t1 score - ${team1Score} , t2 score - ${team2Score}`);

                let t1p = 0, t2p = 0;
                if (t1pd > t2pd) {
                    t1p = findNetPoint.wp;
                } else if (t1pd < t2pd) {
                    t2p = findNetPoint.wp;
                }

                //score, tp, tpd, gameSpec
                const updateTeam1 = await Performance.updateMany({ _id: { $in: us.team1.players } }, { $set: updatedPerformance(us, roundNum, team1Score, t1p, t1pd, us.netID) });
                const updateTeam2 = await Performance.updateMany({ _id: { $in: us.team2.players } }, { $set: updatedPerformance(us, roundNum, team2Score, t2p, t2pd, us.netID) });

            } else if (us.wp === null && us.team1 !== null && us.team2 === null && us.game !== null) {
                // console.log("No temp2 - ",us);
                // WITHOUR NET 
                const findNet = await Net.findById(us.netID);
                let team1Score = 0, t1p = findNet.wp, t1pd = 0;
                // console.log(findNet);
                team1Score = us.team1.score, t1pd = us.team1.score;
                if (team1Score <= 0) t1p = 0;
                const singlePlayer = await Performance.updateOne({ _id: us.team1.players[0] }, { $set: updatedPerformance(us, roundNum, team1Score, t1p, t1pd, us.netID) });
                // if (us.team1.score > 0) {
                //     const singlePlayer = await Performance.updateOne({ _id: us.team1.players[0] }, { $set: updatedPerformance(us, roundNum, team1Score, t1p, t1pd, us.netID) });
                //     // console.log("Positive single player - ", singlePlayer);
                // }else {
                //     const singlePlayer = await Performance.updateOne({ _id: us.team1.players[0] }, { $set: updatedPerformance(us, roundNum, team1Score, 0, t1pd, us.netID) });
                //     // console.log("--------------");
                //     // console.log("Negative single player - ", singlePlayer);
                //     // console.log("Negative single player - ", updatedPerformance(us, roundNum, team1Score, 0, t1pd, us.netID));
                // }
            } else if (us.wp !== null && us.team1 !== null && us.team2 === null && us.game !== null) {
                // console.log("Hit- ", us);
                const findNet = await Net.findOneAndUpdate({ _id: us.netID }, { wp: us.wp });
                let team1Score = us.team1.score, t1p = us.wp, t1pd = us.team1.score;
                team1Score > 0 ? t1p = us.wp : t1p = 0;
                const singlePlayer = await Performance.updateOne({ _id: us.team1.players[0] }, { $set: updatedPerformance(us, roundNum, team1Score, t1p, t1pd, us.netID) });
                // if (Math.sign(us.team1.score) === 1) {
                //     const singlePlayer = await Performance.updateOne({ _id: us.team1.players[0] }, { $set: updatedPerformance(us, roundNum, team1Score, t1p, t1pd, us.netID) });
                // } else {
                //     const singlePlayer = await Performance.updateOne({ _id: us.team1.players[0] }, { $set: updatedPerformance(us, roundNum, team1Score, t1p, t1pd, us.netID) });
                // }
            }
        } catch (error) {
            console.log(error);
        }

    });

    // UPDATE EXISTING PERFORMANCE
    res.status(200).json({ msg: req.body });
});








router.post('/exports/:eventID', ensureAuth, async (req, res, next) => {
    try {

        const { filename } = req.body;
        const allPerformances = await Performance.find({ event: req.params.eventID }).populate({ path: "participant", select: "firstname lastname" });








        // Create a new instance of a Workbook class
        const workbook = new xl.Workbook();

        // Add Worksheets to the workbook
        const worksheet = workbook.addWorksheet('Sheet 1');

        excelCell(allPerformances, worksheet);



        const style = workbook.createStyle({
            font: {
                color: '#FF0800',
                size: 12,
            },
            numberFormat: '$#,##0.00; ($#,##0.00); -',
        });



        // const statistics = await workbook.write(`./temp/${filename}.xlsx`);
        // const file_dir =  `./temp/${filename}.xlsx`;
        const file_dir = path.resolve('temp', `${filename}.xlsx`);
        workbook.write(file_dir, (err, stats) => {
            if (err) throw err;
            // console.log(stats);
            res.download(file_dir, downloadErr => {
                if (downloadErr) throw downloadErr;
                fs.unlink(file_dir, (deleteErr) => {
                    if (deleteErr) throw deleteErr;
                });
            });
        });





        // res.json({ filename });
        // res.download();
    } catch (error) {
        console.log(error);
    }
});










// doc.subdocs.push({ _id: 4815162342 })
// doc.subdocs.pull({ _id: 4815162342 }) // removed
/* ⛏️⛏️ DELETE PARTICIPANT ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖  */
router.delete('/:id', ensureAuth, async (req, res, next) => {
    try {
        // console.log(participant);
        // console.log("DELETE parformance");
        if (req.user.role === SUPER) {
            const participant = await Participant.findByIdAndDelete(req.params.id);
            const performance = await Performance.findOneAndDelete({ participant: req.params.id });
            const event = await Event.findOneAndUpdate({ participants: participant._id }, { $pull: { participants: participant._id } }, { new: true });
            res.status(200).json({ msg: 'Delete a participant', participant, performance, event });
        } else {
            res.status(200).json({ msg: 'Only super user are able to delete any perticipant' });
        }
        // console.log(performance);
        // { $pull: { templates: { _id: templateid } } },
    } catch (error) {
        res.json(error)
    }
});


/* ⛏️⛏️ UPDATE EVENTS OR ADD PARTICIPANTS TO AN EVENTS ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖  */
/*
router.get('/dashboard/participant', async (req, res, next) => {
    try {
        const participant = await Participant.find();
        res.status(200).json({ participant });
    } catch (error) {
        res.json(error);
    }
});
*/







// ⛏️⛏️ GET ALL PERFORMANCES OF ALL NETS OF A SINGLE EVENT ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ 
router.get('/get-performance/:eventID/:roundNum', async (req, res, next) => {
    // console.log(req.params.roundNum);
    // console.log("Get performance");
    try {
        const performances = await Performance.find({ event: req.params.eventID }).populate({ path: "participant", select: "firstname lastname" }).exec();
        const rankingPerformance = performances.sort(wholeRanking)
        // console.log(performances.length);
        res.status(200).json({ msg: 'Get all performance of an event', rankingPerformance });
    } catch (error) {
        console.log(error);
    }
});




module.exports = router;
