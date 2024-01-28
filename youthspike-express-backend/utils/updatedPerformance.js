const Performance = require('../models/Performance');


const updateSG = (gameNum, gameSPPD, wp) => {
    const specGame = `game${gameNum}`;
    const obj = new Object();
    obj.score = gameSPPD.score;
    obj.point = wp;
    obj.pointDeferential = gameSPPD.pointDeferential;
    // console.log({ [specGame]: obj });
    return obj;
}



module.exports.updateOnlyPoint = async (findNet, roundNum, wp) => {
    const performancesIds = [];
    const performances = [];
    for (let i = 0; i < findNet.performance.length; i++) {
        if (roundNum === 1) {
            const gameObj = new Object();
            gameCheck(i, 1, gameObj);
            gameCheck(i, 2, gameObj);
            gameCheck(i, 3, gameObj);
            // console.log(gameObj);
            const updatedPerformance = await Performance.updateOne({ _id: findNet.performance[i]._id }, gameObj);
        }else if (roundNum === 2) {
            const gameObj = new Object();
            gameCheck(i, 4, gameObj);
            gameCheck(i, 5, gameObj);
            gameCheck(i, 6, gameObj);
            // console.log(gameObj);
            const updatedPerformance = await Performance.updateOne({ _id: findNet.performance[i]._id }, gameObj);
        }else if (roundNum === 3) {
            const gameObj = new Object();
            gameCheck(i, 7, gameObj);
            gameCheck(i, 8, gameObj);
            gameCheck(i, 9, gameObj);
            console.log("Performance - ",findNet.performance[i]);
            console.log("Game obj - ",gameObj);
            const updatedPerformance = await Performance.updateOne({ _id: findNet.performance[i]._id }, gameObj);
        }else if (roundNum === 4) {
            const gameObj = new Object();
            gameCheck(i, 10, gameObj);
            gameCheck(i, 11, gameObj);
            gameCheck(i, 12, gameObj);
            // console.log(gameObj);
            const updatedPerformance = await Performance.updateOne({ _id: findNet.performance[i]._id }, gameObj);
        }else if (roundNum === 5) {
            const gameObj = new Object();
            gameCheck(i, 13, gameObj);
            gameCheck(i, 14, gameObj);
            gameCheck(i, 15, gameObj);
            // console.log(gameObj);
            const updatedPerformance = await Performance.updateOne({ _id: findNet.performance[i]._id }, gameObj);
        }
    }
    // console.log(performancesIds);

    function gameCheck(i, gameNum, gameObj) {
        const specGame = `game${gameNum}`;
        if (findNet.performance[i][specGame]) {
            if (findNet.performance[i][specGame].pointDeferential > 0) {
                performancesIds.push(findNet.performance[i]._id);
                performances.push(findNet.performance[i]);
                gameObj[specGame] = updateSG(gameNum, findNet.performance[i][specGame], wp);
            }else{
                performancesIds.push(findNet.performance[i]._id);
                performances.push(findNet.performance[i]);
                gameObj[specGame] = updateSG(gameNum, findNet.performance[i][specGame], 0);
            }
        }
    }
}



// us, round, team1Score, t1p, t1pd, us.netID
module.exports.updatedPerformance = (ut, roundNum, score, tp, tpd, netID) => {
    // console.log("Update performace - ", ut);
    // window[gameSpec] = new Object();
    // window[gameSpec].score = score;
    // window[gameSpec].point = tp;
    // window[gameSpec].pointDeferential = tpd;
    // return { gameSpec: window[gameSpec] }
    // console.log("Total point ",tp);
    if (roundNum == 1) {
        switch (ut.game) {
            case 1:
                let game1 = new Object();
                game1.score = score;
                game1.point = tp;
                game1.pointDeferential = tpd;
                // console.log(game1);
                return { game1 }
            case 2:
                let game2 = new Object();
                game2.score = score;
                game2.point = tp;
                game2.pointDeferential = tpd;
                return { game2 }
            case 3:
                let game3 = new Object();
                game3.score = score;
                game3.point = tp;
                game3.pointDeferential = tpd;
                return { game3 }
        }





    } else if (roundNum == 2) {
        switch (ut.game) {
            case 4:
                let game4 = new Object();
                game4.score = score;
                game4.point = tp;
                game4.pointDeferential = tpd;
                return { game4 }

            case 5:
                let game5 = new Object();
                game5.score = score;
                game5.point = tp;
                game5.pointDeferential = tpd;
                return { game5 }
            case 6:
                let game6 = new Object();
                game6.score = score;
                game6.point = tp;
                game6.pointDeferential = tpd;
                return { game6 }
        }
    } else if (roundNum == 3) {
        switch (ut.game) {
            case 7:
                let game7 = new Object();
                game7.score = score;
                game7.point = tp;
                game7.pointDeferential = tpd;
                return { game7 }
            case 8:
                let game8 = new Object();
                game8.score = score;
                game8.point = tp;
                game8.pointDeferential = tpd;
                return { game8 }
            case 9:
                let game9 = new Object();
                game9.score = score;
                game9.point = tp;
                game9.pointDeferential = tpd;
                return { game9 }
        }
    } else if (roundNum == 4) {
        switch (ut.game) {
            case 10:
                let game10 = new Object();
                game10.score = score;
                game10.point = tp;
                game10.pointDeferential = tpd;
                return { game10 }
            case 11:
                let game11 = new Object();
                game11.score = score;
                game11.point = tp;
                game11.pointDeferential = tpd;
                return { game11 }
            case 12:
                let game12 = new Object();
                game12.score = score;
                game12.point = tp;
                game12.pointDeferential = tpd;

                return { game12 }
        }
    } else if (roundNum == 5) {
        switch (ut.game) {
            case 13:
                let game13 = new Object();
                game13.score = score;
                game13.point = tp;
                game13.pointDeferential = tpd;
                return { game13 }
            case 14:
                let game14 = new Object();
                game14.score = score;
                game14.point = tp;
                game14.pointDeferential = tpd;
                return { game14 }
            case 15:
                let game15 = new Object();
                game15.score = score;
                game15.point = tp;
                game15.pointDeferential = tpd;
                return { game15 }
        }
    }
}



module.exports.getScoreFromDoc = (game, doc) => {
    let score = 0;
    switch (game) {
        case 1:
            if (doc.game1) score = doc.game1.score;
            return score;
        case 2:
            if (doc.game2) score = doc.game2.score;
            return score;
        case 3:
            if (doc.game3) score = doc.game3.score;
            return score;
        case 4:
            if (doc.game4) score = doc.game4.score;
            return score;
        case 5:
            if (doc.game5) score = doc.game5.score;
            return score;
        case 6:
            if (doc.game6) score = doc.game6.score;
            return score;
        case 7:
            if (doc.game7) score = doc.game7.score;
            return score;
        case 8:
            if (doc.game8) score = doc.game8.score;
            return score;
        case 9:
            if (doc.game9) score = doc.game9.score;
            return score;
        case 10:
            if (doc.game10) score = doc.game10.score;
            return score;
        case 11:
            if (doc.game11) score = doc.game11.score;
            return score;
        case 12:
            if (doc.game12) score = doc.game12.score;
            return score;
        case 13:
            if (doc.game13) score = doc.game13.score;
            return score;
        case 14:
            if (doc.game14) score = doc.game14.score;
            return score;
        case 15:
            if (doc.game15) score = doc.game15.score;
            return score;
    }

}


