module.exports.sendUser = (user) => {
    return {
        name: user.name,
        email: user.email,
        role: user.role,
        _id: user._id,
    };
}


module.exports.replaceKeys = (object, eventID) => {
    Object.keys(object).forEach(function (key) {
        // const twoLower = key.toLowerCase();
        const removeSpace = key.replace(/\s+/g, '');
        let newKey = removeSpace.toString().toLowerCase();
        if (newKey === "mobilenumber") newKey = "cell";
        if (newKey === "totalamount") newKey = "payment_amount";
        // console.log(newKey);
        if (object[key] && typeof object[key] === 'object') {
            replaceKeys(object[key]);
        }
        if (key !== newKey) {
            object[newKey] = object[key];
            if (object[newKey].mobilenumber) {
            }
            delete object[key];
        }
    });
    object.event = eventID
    return object;
}


module.exports.swapArrayItem = (ary, a, b) => {
    [ary[a], ary[b]] = [ary[b], ary[a]];
}

module.exports.findRound = async (eventID, roundNum, Round) => {
    const select = "participant net game1 game2 game3 game4 game5 game6 game7 game8 game9 game10 game11 game12 game13 game14 game15 pre_rank";
    const round = await Round.findOne({ event: eventID, no: roundNum })
        .populate([{
            path: "nets",
            select: "performance wp sl",
            populate: {
                path: 'performance',
                select,
                populate: {
                    path: "participant",
                    select: "firstname lastname"
                }
            }
        },
        {
            path: "performances",
            select,
            populate: {
                path: "participant",
                select: "firstname lastname"
            }
        }
        ])
        .exec();
    // console.log("Find Round - ", round);
    return round;
}



