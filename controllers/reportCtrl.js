var sessionUtils = require('../utils/sessionUtils');
var databaseUtils=require('./../utils/databaseUtils');
module.exports = {
    
    showReportpage: async (ctx) => {
        var msg;
        var pid;
try{ pid=ctx.currentUser[0].PID;}
catch(e){pid=0;
    msg='Login FIrst';

}
if(msg) await ctx.render('login',{
    msg:msg,
});
else{
        var queryString;
        var query;
        var msg;
        // QUERY FOR GETTING SHIFT DETAILS
        queryString=`SELECT SND.SHIFT_ID AS ID, SM.SHIFT_TYPE, DATE(SM.STARTTIME) AS DATE, U1.FNAME AS SUPERVISOR 
                     FROM SHIFT_NOZZLE_DSM SND 
                     JOIN SHIFT S ON SND.SHIFT_ID = S.ID 
                     JOIN SHIFT_METADATA SM ON S.SHIFT_META_DATA_ID = SM.ID 
                     JOIN USER U1 ON S.SUPERVISOR_ID = U1.ID 
                     WHERE SND.DCR != 0 AND S.PID = ? 
                     ORDER BY SND.SHIFT_ID DESC LIMIT 1`;
        var shiftDetailsResult=await databaseUtils.executeQuery(queryString, [pid]);
        shiftDetailsResult = shiftDetailsResult || [];

        if(shiftDetailsResult.length==0){
            msg='No Reports Found...!!!';
            await ctx.render('report',{
                msg:msg,
            });
        }
        else{

        var sid;
        //Fetching Shift ID from Query Parameter for Particuler shift
        sid=ctx.request.query.sid;
        console.log('Query parameter se li sid hai...',sid);
        if(!sid){
        //Fetched Shift ID
        var sid=shiftDetailsResult[0].ID;
        }
        else{
            queryString=`SELECT SND.SHIFT_ID AS ID, SM.SHIFT_TYPE, DATE(SM.STARTTIME) AS DATE, U1.FNAME AS SUPERVISOR 
                         FROM SHIFT_NOZZLE_DSM SND 
                         JOIN SHIFT S ON SND.SHIFT_ID = S.ID 
                         JOIN SHIFT_METADATA SM ON S.SHIFT_META_DATA_ID = SM.ID 
                         JOIN USER U1 ON S.SUPERVISOR_ID = U1.ID 
                         WHERE S.PID = ? AND S.ID = ?`;
            shiftDetailsResult=await databaseUtils.executeQuery(queryString, [pid, sid]);
        }
        console.log(sid);

        // QUERY FOR ELECTRONIC TOTALIZER 
        queryString=`SELECT N.NOZZLE_NUMBER AS NOZZLE, N.TYPE AS PRODUCT, U1.FNAME AS ASSIGNTED_TO, SND.DOR, SND.DCR, SND.PUMP_TEST, (SND.DCR - SND.DOR - SND.PUMP_TEST) AS SALE 
                     FROM SHIFT_NOZZLE_DSM SND 
                     JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                     JOIN USER U1 ON SND.USER_ID = U1.ID 
                     WHERE SND.SHIFT_ID = ? AND N.PID = ?`;
        var elecTotalizerResult=await databaseUtils.executeQuery(queryString, [sid, pid]);
        elecTotalizerResult = elecTotalizerResult || [];

        queryString=`SELECT N.TYPE AS PRODUCT, SUM(SND.DCR - SND.DOR) AS DISP, SUM(SND.PUMP_TEST) AS PUMPTEST, SUM(SND.DCR - SND.DOR - SND.PUMP_TEST) AS SALE 
                     FROM SHIFT_NOZZLE_DSM SND 
                     JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                     JOIN USER U1 ON SND.USER_ID = U1.ID 
                     WHERE SND.SHIFT_ID = ? AND N.PID = ? 
                     GROUP BY N.TYPE ORDER BY N.TYPE`;
        var elecTotalizerResult1=await databaseUtils.executeQuery(queryString, [sid, pid]);
        elecTotalizerResult1 = elecTotalizerResult1 || [];

        // QUERY FOR MANUAL TOTALIZER 
        queryString=`SELECT N.NOZZLE_NUMBER AS NOZZLE, N.TYPE AS PRODUCT, U1.FNAME AS ASSIGNTED_TO, SND.AOR, SND.ACR, SND.PUMP_TEST, (SND.ACR - SND.AOR - SND.PUMP_TEST) AS SALE 
                     FROM SHIFT_NOZZLE_DSM SND 
                     JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                     JOIN USER U1 ON SND.USER_ID = U1.ID 
                     WHERE SND.SHIFT_ID = ? AND N.PID = ?`;
        var manTotalizerResult=await databaseUtils.executeQuery(queryString, [sid, pid]);
        manTotalizerResult = manTotalizerResult || [];

        queryString=`SELECT N.TYPE AS PRODUCT, SUM(SND.ACR - SND.AOR) AS DISP, SUM(SND.PUMP_TEST) AS PUMPTEST, SUM(SND.ACR - SND.AOR - SND.PUMP_TEST) AS SALE 
                     FROM SHIFT_NOZZLE_DSM SND 
                     JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                     JOIN USER U1 ON SND.USER_ID = U1.ID 
                     WHERE SND.SHIFT_ID = ? AND N.PID = ? 
                     GROUP BY N.TYPE`;
        var manTotalizerResult1=await databaseUtils.executeQuery(queryString, [sid, pid]);
        manTotalizerResult1 = manTotalizerResult1 || [];

        // QUERY FOR DIFF  BETWEEN ELEC. AND MANUAL TOTALIZER 
        queryString=`SELECT N.TYPE AS PRODUCT, SUM(SND.PUMP_TEST) AS PUMPTEST, (SUM(SND.AOR - SND.ACR - SND.PUMP_TEST) - SUM(SND.DOR - SND.DCR - SND.PUMP_TEST)) AS DIFFERENCE 
                     FROM SHIFT_NOZZLE_DSM SND 
                     JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                     JOIN USER U1 ON SND.USER_ID = U1.ID 
                     WHERE SND.SHIFT_ID = ? AND N.PID = ? 
                     GROUP BY N.TYPE ORDER BY N.TYPE`;
        var emdiffResult=await databaseUtils.executeQuery(queryString, [sid, pid]);
        emdiffResult = emdiffResult || [];
        
        // TANK HEIGHT QUERIES - Tables don't exist, return empty
   //     var tankheightResult1 = [];
     //   var tankheightResult2 = [];
        const closeTankQuery = `
SELECT 
       TM.TYPE,
       CLOSE_READING,
       (CMV + MMV * (CLOSE_READING - CAST(CLOSE_READING AS SIGNED)) * 10) AS CLOSE
FROM TANK T
LEFT JOIN TANK_METADATA TM ON T.TANK_ID = TM.ID
LEFT JOIN PRODUCT P ON TM.TYPE = P.NAME
LEFT JOIN DATASHEET D ON T.TANK_ID = D.TANK_METADATA_ID
WHERE TM.PID = ?
  AND D.HEIGHT = CAST(CLOSE_READING AS SIGNED)
  AND T.SHIFT_ID = ?
ORDER BY TM.TYPE
`;
//var tankheightResult1 = yield databaseUtils.executeQuery(query);
const tankheightResult1 = await databaseUtils.executeQuery(
  closeTankQuery,
  [pid, sid]
) || [];


var openTankQuery = `
SELECT 
       TM.TYPE,
       OPEN_READING,
       (CMV + MMV * (OPEN_READING - CAST(OPEN_READING AS SIGNED)) * 10) AS OPEN
FROM TANK T
LEFT JOIN TANK_METADATA TM ON T.TANK_ID = TM.ID
LEFT JOIN PRODUCT P ON TM.TYPE = P.NAME
LEFT JOIN DATASHEET D ON T.TANK_ID = D.TANK_METADATA_ID
WHERE TM.PID = ?
  AND D.HEIGHT = CAST(OPEN_READING AS SIGNED)
  AND T.SHIFT_ID = ?
ORDER BY TM.TYPE
`;
//var tankheightResult2 = yield databaseUtils.executeQuery(query);
const tankheightResult2 = await databaseUtils.executeQuery(
  openTankQuery,
  [pid, sid]
) || [];
        console.log(tankheightResult1.length,tankheightResult2.length);
        // QUERY FOR PRODUCT PRICE 
        queryString=`SELECT DISTINCT(P.NAME) AS NAME, P.PRICE FROM PRODUCT P 
                     JOIN NOZZLE N ON N.TYPE = P.NAME 
                     WHERE P.PID = ? ORDER BY P.NAME`;
        var priceResult=await databaseUtils.executeQuery(queryString, [pid]);
        priceResult = priceResult || [];

        // SS CHECKSHEET QUERY FOR ESTIMATING COLLECTION 
        queryString=`SELECT N.NOZZLE_NUMBER, U.FNAME AS ASSIGNED_TO, N.TYPE, (SND.DCR - SND.DOR - SND.PUMP_TEST - SND.SELF) AS SALE, (SND.DCR - SND.DOR - SND.PUMP_TEST - SND.SELF) * P.PRICE AS COLLECTION 
                     FROM SHIFT S 
                     JOIN SHIFT_NOZZLE_DSM SND ON S.ID = SND.SHIFT_ID 
                     JOIN NOZZLE N ON N.ID = SND.NOZZLE_ID 
                     JOIN PRODUCT P ON N.TYPE = P.NAME 
                     JOIN USER U ON SND.USER_ID = U.ID 
                     WHERE S.ID = ? AND P.PID = ? 
                     ORDER BY N.NOZZLE_NUMBER`;
        var estResult=await databaseUtils.executeQuery(queryString, [sid, pid]);
        estResult = estResult || [];

        // CHECKSHEET QUERY FOR ACTUAL COLLECTION (TO SHOW) 
        queryString=`SELECT N.NOZZLE_NUMBER, U.FNAME, CM.MODE, SC.AMOUNT  
                     FROM SHIFT S 
                     JOIN SHIFT_NOZZLE_DSM SND ON S.ID = SND.SHIFT_ID 
                     JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                     JOIN SHIFT_COLLECTION SC ON SND.ID = SC.SHIFT_NOZZLE_DSM_ID 
                     JOIN COLLECTION_MODE CM ON SC.COLLECTION_MODE_ID = CM.ID 
                     JOIN USER U ON SND.USER_ID = U.ID 
                     WHERE S.PID = ? AND S.ID = ? 
                     ORDER BY N.NOZZLE_NUMBER`;
        var actResult=await databaseUtils.executeQuery(queryString, [pid, sid]);
        actResult = actResult || [];

        // CHECKSHEET QUERY FOR ACTUAL COLLECTION (TO CALCULATE) 
        queryString='SELECT NOZZLE_NUMBER,U.FNAME AS ASSIGNED_TO ,SUM(SC.AMOUNT) AS COLLECTION FROM SHIFT S JOIN SHIFT_NOZZLE_DSM SND ON S.ID=SND.SHIFT_ID JOIN NOZZLE N ON SND.NOZZLE_ID=N.ID JOIN SHIFT_COLLECTION SC ON SND.ID=SC.SHIFT_NOZZLE_DSM_ID JOIN COLLECTION_MODE CM ON SC.COLLECTION_MODE_ID=CM.ID JOIN USER U ON U.ID=SND.USER_ID WHERE S.PID=? AND S.ID=? GROUP BY NOZZLE_NUMBER ORDER BY NOZZLE_NUMBER';
        var actResult1=await databaseUtils.executeQuery(queryString, [pid, sid]);
        console.log("actResult"+actResult);
        actResult1 = actResult1 || [];
// =============================
// INVENTORY ADJUSTMENT SECTION
// =============================

let adjustmentQuery = `
SELECT PRODUCT_TYPE,
       SUM(QTY) AS TOTAL_ADJUSTMENT
FROM INVENTORY_LEDGER
WHERE PID = ?
  AND SOURCE_TYPE = 'ADJUSTMENT'
  AND SOURCE_ID = ?
GROUP BY PRODUCT_TYPE
ORDER BY PRODUCT_TYPE
`;

let adjustmentResult = await databaseUtils.executeQuery(
    adjustmentQuery,
    [pid, sid]
);

adjustmentResult = adjustmentResult || [];
// POS SUMMARY FOR SELECTED SHIFT OR DATE
const posQuery = `
SELECT
    COUNT(*) AS TOTAL_BILLS,
    COALESCE(SUM(TOTAL),0) AS POS_TOTAL
FROM POS_BILL
WHERE SHIFT_ID = ? AND PID = ?
`;

const posSummary = await databaseUtils.executeQuery(posQuery, [sid, pid]) || [];

const TOTAL_BILLS = posSummary.length ? posSummary[0].TOTAL_BILLS : 0;
const POS_TOTAL   = posSummary.length ? posSummary[0].POS_TOTAL : 0;

const posData = posSummary[0] || { TOTAL_BILLS: 0, POS_TOTAL: 0 };
        var msg;

        await ctx.render('report',{
            shiftDetailsResult:shiftDetailsResult[0],
            elecTotalizerResult:elecTotalizerResult,
            elecTotalizerResult1:elecTotalizerResult1,
            manTotalizerResult:manTotalizerResult,
            manTotalizerResult1:manTotalizerResult1,
            emdiffResult:emdiffResult,
        //    tankheightResult:tankheightResult,
            priceResult:priceResult,
            estResult:estResult,
            actResult:actResult,
            actResult1:actResult1,
            msg:msg,
            tankheightResult1:tankheightResult1,
            tankheightResult2:tankheightResult2,
                adjustmentResult:adjustmentResult,   // 👈 ADD THIS
                    posData
,

        });
    }
    }
    }

}
