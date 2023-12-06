const excelCell = (allPerformances, worksheet) => {


    const example = [
        {
            nog: 1,
            _id: "61750e90f27635275693d7cc",
            participant: {
                _id: "61750e90f27635275693d7c3",
                firstname: 'Cruise',
                lastname: 'Hamesworth'
            },
            event: "61750e83f27635275693d7ba",
            __v: 0,
            game1: {
                score: 15,
                point: 1,
                pointDeferential: 6,
                _id: "61765c3adb45922d6b78febd"
            },
            game3: {
                score: 3,
                point: 0,
                pointDeferential: -3,
                _id: "61765dbdd966262e8bccd5fc"
            },
            game2: {
                score: 17,
                point: 1,
                pointDeferential: 10,
                _id: "61765cf5d966262e8bccd5b0"
            }
        }];

    const checkGame = (gameSPPD) => {
        if (gameSPPD !== undefined || gameSPPD) {
            return {
                score: gameSPPD.score,
                point: gameSPPD.point,
                pointDeferential: gameSPPD.pointDeferential
            }
        } else {
            return {
                score: null,
                point: null,
                pointDeferential: null
            }
        }
    }
    const precisePerformance = allPerformances.map((per, i) => {
        return {
            fullname: per.participant.firstname + " " + per.participant.lastname,
            game1: checkGame(per.game1),
            game2: checkGame(per.game2),
            game3: checkGame(per.game3),
            game4: checkGame(per.game4),
            game5: checkGame(per.game5),
            game6: checkGame(per.game6),
            game7: checkGame(per.game7),
            game8: checkGame(per.game8),
            game9: checkGame(per.game9),
            game10: checkGame(per.game10),
            game11: checkGame(per.game11),
            game12: checkGame(per.game12),
            game13: checkGame(per.game13),
            game14: checkGame(per.game14),
            game15: checkGame(per.game15),
        }
    });



    // console.log(precisePerformance);









    // console.log(allKeys);

    const allKeys = Object.keys(precisePerformance[0]);
    // // FIRST ROW - TOTAL 16 COLUMN (MERGED BY TWO, WE HAVE TOTAL 16 PROPERTIES)

    const chunk = 3;
    let i = 0, cell = 3, row = 1, col = 1;


    // ROW - 1, COL - 2
    // worksheet.cell(1, 1, 1, 2, true).string("Merge Cell A");
    // worksheet.cell(1, 3, 1, 4, true).string("Merge Cell B");
    // ADD FIRST ROW 
    while (i < allKeys.length) {
        if (i === 0) {
            worksheet.cell(row, col, 1, 1, true).string("Full Name");
            col += 1;
            cell = chunk + 1;
        } else {
            worksheet.cell(row, col, 1, cell, true).string(allKeys[i]);
            col += chunk;
            cell += chunk;
        }
        i++
    }



    // ADD SECOND ROW 
    const secondChunk = 3;
    let r2i = 0, r2cell = 3, r2row = 2, r2col = 1;

    while (r2i < allKeys.length) {
        // console.log(allKeys[r2i]);
        if (r2i === 0) {
            // worksheet.cell(r2row, r2col).string("allKeys[i]");
            r2col++
        } else {
            worksheet.cell(r2row, r2col).string("Score");
            worksheet.cell(r2row, r2col + 1).string("Point");
            worksheet.cell(r2row, r2col + 2).string("Point Differential");
            r2col += secondChunk;
        }

        r2i++;
    }




    let startRow = 3;
    let gameCol = 1;
    for (let i = 0; i < precisePerformance.length; i++) {
        // FULLNAME 
        worksheet.cell(startRow + i, 1).string(precisePerformance[i].fullname);

        // SPECIFIC GAME 1
        if(precisePerformance[i].game1.score !== null && precisePerformance[i].game1.point !== null && precisePerformance[i].game1.pointDeferential !== null){
            worksheet.cell(startRow + i, 2).number(precisePerformance[i].game1.score);
            worksheet.cell(startRow + i, 3).number(precisePerformance[i].game1.point);
            worksheet.cell(startRow + i, 4).number(precisePerformance[i].game1.pointDeferential);
        }
        // console.log("Score - ",precisePerformance[i].game1.score);
        // console.log("point - ",precisePerformance[i].game1.point);
        // console.log("pointDeferential - ",precisePerformance[i].game1.pointDeferential);



        // CHECK EVERY GAME EXIST OR NOT 
        // SPECIFIC GAME 2
        if(precisePerformance[i].game2.score !== null && precisePerformance[i].game2.point !== null && precisePerformance[i].game2.pointDeferential !== null){
            worksheet.cell(startRow + i, 5).number(precisePerformance[i].game2.score);
            worksheet.cell(startRow + i, 6).number(precisePerformance[i].game2.point);
            worksheet.cell(startRow + i, 7).number(precisePerformance[i].game2.pointDeferential);
        }


        // SPECIFIC GAME 3
        if(precisePerformance[i].game3.score !== null && precisePerformance[i].game3.point !== null && precisePerformance[i].game3.pointDeferential !== null){
            worksheet.cell(startRow + i, 8).number(precisePerformance[i].game3.score);
            worksheet.cell(startRow + i, 9).number(precisePerformance[i].game3.point);
            worksheet.cell(startRow + i, 10).number(precisePerformance[i].game3.pointDeferential);
        }


        // SPECIFIC GAME 4
        if(precisePerformance[i].game4.score !== null && precisePerformance[i].game4.point !== null && precisePerformance[i].game4.pointDeferential !== null){
            worksheet.cell(startRow + i, 11).number(precisePerformance[i].game4.score);
            worksheet.cell(startRow + i, 12).number(precisePerformance[i].game4.point);
            worksheet.cell(startRow + i, 13).number(precisePerformance[i].game4.pointDeferential);
        }


        // SPECIFIC GAME 5
        if(precisePerformance[i].game5.score !== null && precisePerformance[i].game5.point !== null && precisePerformance[i].game5.pointDeferential !== null){
            worksheet.cell(startRow + i, 14).number(precisePerformance[i].game5.score);
            worksheet.cell(startRow + i, 15).number(precisePerformance[i].game5.point);
            worksheet.cell(startRow + i, 16).number(precisePerformance[i].game5.pointDeferential);
        }


        // SPECIFIC game6
        if(precisePerformance[i].game6.score !== null && precisePerformance[i].game6.point !== null && precisePerformance[i].game6.pointDeferential !== null){
            worksheet.cell(startRow + i, 17).number(precisePerformance[i].game6.score);
            worksheet.cell(startRow + i, 18).number(precisePerformance[i].game6.point);
            worksheet.cell(startRow + i, 19).number(precisePerformance[i].game6.pointDeferential);
        }


        // SPECIFIC game7
        if(precisePerformance[i].game7.score !== null && precisePerformance[i].game7.point !== null && precisePerformance[i].game7.pointDeferential !== null){
            worksheet.cell(startRow + i, 20).number(precisePerformance[i].game7.score);
            worksheet.cell(startRow + i, 21).number(precisePerformance[i].game7.point);
            worksheet.cell(startRow + i, 22).number(precisePerformance[i].game7.pointDeferential);
        }


        // SPECIFIC game8
        if(precisePerformance[i].game8.score !== null && precisePerformance[i].game8.point !== null && precisePerformance[i].game8.pointDeferential !== null){
            worksheet.cell(startRow + i, 23).number(precisePerformance[i].game8.score);
            worksheet.cell(startRow + i, 24).number(precisePerformance[i].game8.point);
            worksheet.cell(startRow + i, 25).number(precisePerformance[i].game8.pointDeferential);
        }



        // SPECIFIC game9
        if(precisePerformance[i].game9.score !== null && precisePerformance[i].game9.point !== null && precisePerformance[i].game9.pointDeferential !== null){
            worksheet.cell(startRow + i, 26).number(precisePerformance[i].game9.score);
            worksheet.cell(startRow + i, 27).number(precisePerformance[i].game9.point);
            worksheet.cell(startRow + i, 28).number(precisePerformance[i].game9.pointDeferential);
        }



        // SPECIFIC game10
        if(precisePerformance[i].game10.score !== null && precisePerformance[i].game10.point !== null && precisePerformance[i].game10.pointDeferential !== null){
            worksheet.cell(startRow + i, 29).number(precisePerformance[i].game10.score);
            worksheet.cell(startRow + i, 30).number(precisePerformance[i].game10.point);
            worksheet.cell(startRow + i, 31).number(precisePerformance[i].game10.pointDeferential);
        }



        // SPECIFIC game11
        if(precisePerformance[i].game11.score !== null && precisePerformance[i].game11.point !== null && precisePerformance[i].game11.pointDeferential !== null){
            worksheet.cell(startRow + i, 32).number(precisePerformance[i].game11.score);
            worksheet.cell(startRow + i, 33).number(precisePerformance[i].game11.point);
            worksheet.cell(startRow + i, 34).number(precisePerformance[i].game11.pointDeferential);
        }


        // SPECIFIC game12
        if(precisePerformance[i].game12.score !== null && precisePerformance[i].game12.point !== null && precisePerformance[i].game12.pointDeferential !== null){
            worksheet.cell(startRow + i, 35).number(precisePerformance[i].game12.score);
            worksheet.cell(startRow + i, 36).number(precisePerformance[i].game12.point);
            worksheet.cell(startRow + i, 37).number(precisePerformance[i].game12.pointDeferential);
        }



        // SPECIFIC game13
        if(precisePerformance[i].game13.score !== null && precisePerformance[i].game13.point !== null && precisePerformance[i].game13.pointDeferential !== null){
            worksheet.cell(startRow + i, 38).number(precisePerformance[i].game13.score);
            worksheet.cell(startRow + i, 39).number(precisePerformance[i].game13.point);
            worksheet.cell(startRow + i, 40).number(precisePerformance[i].game13.pointDeferential);
        }



        // SPECIFIC game14
        if(precisePerformance[i].game14.score !== null && precisePerformance[i].game14.point !== null && precisePerformance[i].game14.pointDeferential !== null){
            worksheet.cell(startRow + i, 41).number(precisePerformance[i].game14.score);
            worksheet.cell(startRow + i, 42).number(precisePerformance[i].game14.point);
            worksheet.cell(startRow + i, 43).number(precisePerformance[i].game14.pointDeferential);
        }


        // SPECIFIC game15
        if(precisePerformance[i].game15.score !== null && precisePerformance[i].game15.point !== null && precisePerformance[i].game15.pointDeferential !== null){
            worksheet.cell(startRow + i, 44).number(precisePerformance[i].game15.score);
            worksheet.cell(startRow + i, 45).number(precisePerformance[i].game15.point);
            worksheet.cell(startRow + i, 46).number(precisePerformance[i].game15.pointDeferential);
        }

        gameCol++;
        // console.log(precisePerformance[i].game1);
    }

















    // worksheet.row(2).group(1, true);


    // Set value of cell A1 to 100 as a number type styled with paramaters of style
    // worksheet.cell(2, 1)
    //     .number(100);

    // // Set value of cell B1 to 200 as a number type styled with paramaters of style
    // worksheet.cell(2, 2)
    //     .number(200);

    // // Set value of cell C1 to a formula styled with paramaters of style
    // worksheet.cell(1, 3)
    //     .formula('A1 + B1')
    //     .style(style);

    // // Set value of cell A2 to 'string' styled with paramaters of style
    // worksheet.cell(2, 1)
    //     .string('string')
    //     .style(style);

    // // Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
    // worksheet.cell(3, 1)
    //     .bool(true)
    //     .style(style)
    //     .style({ font: { size: 14 } });


}


module.exports = excelCell;