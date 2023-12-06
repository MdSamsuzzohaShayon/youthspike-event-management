const express = require('express');
const Performance = require('../models/Performance');
const Round = require('../models/Round');
const Net = require('../models/Net');
const { ensureAuth } = require('../config/auth');
const { rankingRound1, wholeRanking, rankingRound2Ind, rankingRound3Ind, rankingRound4Ind, rankingRound5Ind, netRanking, roundwiseRanking } = require('../utils/ranking');
const { findRound } = require('../utils/helpers');


const router = express.Router();
// arr[Math.floor(Math.random() * arr.length)];




// GET PERFORMANCE 
/*

try {
    // console.log("Req params - ",req.params);
    const {roundNum, eventID} = req.params;
    const rNumInt = parseInt(roundNum);
    if (rNumInt === 1) {
        // SEARCH FOR EXISTING ROUND - IF THERE IS NOT EXISTING ROUND USE ALL PERFORMANCE
        const roundExist = await Round.findOne({event: eventID, no: roundNum});
        console.log("round Exist - ",roundExist);
        let performances = null;
        if(roundExist){
            // performances = roundExist
            console.log(roundExist);
        }else{
            performances = await Performance.find({ event: eventID }).populate({ path: "participant", select: "firstname lastname" }).exec();
        }
        const rankingPerformance = performances.sort(wholeRanking)
        // // console.log(performances.length);
        res.status(200).json({ msg: 'Get all performance of an event', rankingPerformance });
    } else {
        console.log(roundNum);
    //     const findPreviousRound = await Round.findOne({ event: eventID, no: roundNum })
    //         .populate({
    //             path: "nets",
    //             select: "performance",
    //             populate: {
    //                 path: 'performance',
    //                 select: 'participant nog net game1 game2 game3 game4 game5 game6 game7 game8 game9 game10 game11 game12 game13 game14 game15',
    //                 populate: {
    //                     path: "participant",
    //                     select: "firstname lastname"
    //                 }
    //             }
    //         })
    //         .exec();
    }
} catch (error) {
    console.log(error);
}
*/

// ⛏️⛏️ GET SINGLE ROUND ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ 
router.get('/get-single-round/:eventID/:roundNum', async (req, res, next) => {
    const { eventID, roundNum } = req.params;
    try {
        const roundExist = await findRound(eventID, roundNum, Round);

        // console.log("round Exist - ",roundExist);
        let performances = null;
        let leftRound = null;
        let rankNets = null;

        // SHOW EXISTING PERFORMANCES EXISTING LEFT NETS AND MORE
        if (roundExist) {
            performances = roundExist.performances;
            leftRound = await Performance.find({ _id: { $in: roundExist.left } })
                .populate({
                    path: "participant",
                    select: "firstname lastname"
                });
            // const existingNet = roundExist.nets;
            // 61765dbdd966262e8bccd5fc
            const allNetsIds = new Array();
            for (let i = 0; i < roundExist.nets.length; i++) {
                allNetsIds.push(roundExist.nets[i]._id);
            }
            const select = "participant net game1 game2 game3 game4 game5 game6 game7 game8 game9 game10 game11 game12 game13 game14 game15 pre_rank";
            // console.log(allNetsIds);
            const findNets = await Net.find({ _id: { $in: allNetsIds } }).populate({
                path: "performance", select, populate: {
                    path: "participant",
                    select: "firstname lastname"
                }
            });
            // console.log(nets);
            rankNets = netRanking(findNets, parseInt(roundNum));
            // const netRank = roundExist.nets[0].performance.sort(rankingRound1);
            // console.log(rankNets);
        } else {
            performances = await Performance.find({ event: eventID }).populate({ path: "participant", select: "firstname lastname" }).exec();
        }

        if (performances !== null) {
            performances = await roundwiseRanking(performances, parseInt(roundNum), eventID);
        }


        // console.log(roundExist);
        res.status(200).json({ msg: 'Getting Rounds', findRound: roundExist, rankNets, leftRound, performances });
    } catch (error) {
        console.log(error);
    }
});







// ⛏️⛏️ ASSIGN PLAYER TO THE NET - CREATE CREATE MORE NET ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ 
router.get('/ranking/:eventID', async (req, res, next) => {
    try {
        const { eventID } = req.params;
        const rounds = {};
        for (let i = 1; i <= 5; i++) {
            const round = await findRound(eventID, i, Round);
            let performances = null;
            if (round) {
                rounds[`round${i}NR`] = round;
                performances = round.performances;
		performances = await roundwiseRanking(performances, i, eventID);
		rounds[`round${i}`] = performances;
            }
        }
        const allPerformances = await roundwiseRanking([], 6, eventID);
        /* const performance = await Performance.find({ event: req.params.eventID }).populate({ path: "participant", select: "firstname lastname" });
        const allPerformances = performance.sort(wholeRanking);



        const rounds = await Round.find({ event: req.params.eventID }).populate({
            path: 'performances',
            select: 'participant net game1 game2 game3 game4 game5 game6 game7 game8 game9 game10 game11 game12 game13 game14 game15 pre_rank',
            populate: {
                path: "participant",
                select: "firstname lastname"
            }
        }).exec();

        // console.log(rounds);




        let round1 = null, round2 = null, round3 = null, round4 = null, round5 = null;
        let round1NR = null, round2NR = null, round3NR = null, round4NR = null, round5NR = null;
        const round1Slice = rounds.filter(r => r.no === 1)[0];
        // console.log(round1Slice);
        if (round1Slice) {
            // const round1Asscending = round1Slice.performances.sort(rankingRound1);
            // round1 = round1Asscending.filter(r => r.game1 || r.game2 || r.game3);
            round1 = round1Slice.performances.sort(rankingRound1);
            round1NR = round1Slice;

        }



        const round2Slice = rounds.filter(r => r.no === 2)[0];
        if (round2Slice) {
            round2 = round2Slice.performances.sort(rankingRound2Ind);
            // const round2Asscending = round2Slice.performances.sort(rankingRound2Ind);
            // round2 = round2Asscending.filter(r => r.game4 || r.game5 || r.game6);
            // round2Asscending.forEach(r2=> console.log(r2));
            // console.log(round2Asscending);
            // console.log(round2);
            round2NR = round2Slice;

        }




        const round3Slice = rounds.filter(r => r.no === 3)[0];
        if (round3Slice) {
            round3 = round3Slice.performances.sort(rankingRound3Ind);
            // const round3Asscending = round3Slice.performances.sort(rankingRound3Ind);
            // round3 = round3Asscending.filter(r => r.game7 || r.game8 || r.game9);
            round3NR = round3Slice;

        }


        const round4Slice = rounds.filter(r => r.no === 4)[0];
        if (round4Slice) {
            round4 = round4Slice.performances.sort(rankingRound4Ind);
            // const round4Asscending = round4Slice.performances.sort(rankingRound4Ind);
            // round4 = round4Asscending.filter(r => r.game10 || r.game11 || r.game12);
            round4NR = round4Slice;

        }


        const round5Slice = rounds.filter(r => r.no === 5)[0];
        if (round5Slice) {
            round5 = round5Slice.performances.sort(rankingRound5Ind);
            // const round4Asscending = round5Slice.performances.sort(rankingRound4Ind);
            // round5 = round4Asscending.filter(r => r.game10 || r.game11 || r.game12);
            round5NR = round5Slice;

        }
 */


        //res.status(201).json({ msg: "rank performance and inatilize performance", allPerformances, round1, round2, round3, round4, round5, round1NR, round2NR, round3NR, round4NR, round5NR })
        res.status(201).json({ msg: "rank performance and inatilize performance", allPerformances, ...rounds })

    } catch (error) {
        console.log(error);
    }
});













// ⛏️⛏️ RANDOM REASSIGN ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ 





// ⛏️⛏️ DELETE A ROUND ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ 
router.delete('/:eventID/:roundNum', ensureAuth, async (req, res, next) => {
    try {
        const deleteRound = await Round.findOneAndDelete({ no: req.params.roundNum, event: req.params.eventID });
        // console.log(deleteRound);
        const deleteNets = await Net.deleteMany({ round: deleteRound._id });
        // console.log(req.params);
        res.status(200).json({ msg: 'Getting performance', deleteRound, deleteNets });
    } catch (error) {
        console.log(error);
    }
});







module.exports = router;


