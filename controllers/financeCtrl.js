var sessionUtils = require('../utils/sessionUtils');
var util = require('util');
var databaseUtils = require('./../utils/databaseUtils');

module.exports = {

    showfinancePage: async (ctx) => {

        var pid;
        try { pid = ctx.currentUser[0].PID; }
        catch (e) { pid = 0; }
        var nozzle_number = ctx.request.query.no;
        if (nozzle_number == undefined) {
            nozzle_number = 1;
        }

        var queryString;
        var query;

        // Set default date range to last 30 days
        let defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 00:00:00';
        let defaultToDate = new Date().toISOString().split('T')[0] + ' 23:59:59';

        //querry to show all details about all shifts
        queryString = `SELECT U1.FNAME AS SUPERVISOR, U2.FNAME AS ASSIGNED_TO, NOZZLE.TYPE, NOZZLE.NOZZLE_NUMBER, SHIFT.START_TIME, SND.USER_ID, (SND.DOR - SND.DCR - SND.PUMP_TEST - SND.SELF) AS SALE, SC.ID, CM.MODE, SC.AMOUNT 
                     FROM SHIFT 
                     JOIN SHIFT_NOZZLE_DSM SND ON SHIFT.ID = SND.SHIFT_ID 
                     JOIN USER U1 ON U1.ID = SHIFT.SUPERVISOR_ID 
                     JOIN NOZZLE ON SND.NOZZLE_ID = NOZZLE.ID 
                     JOIN SHIFT_COLLECTION SC ON SND.ID = SC.SHIFT_NOZZLE_DSM_ID 
                     JOIN COLLECTION_MODE CM ON CM.ID = SC.COLLECTION_MODE_ID 
                     JOIN USER U2 ON SND.USER_ID = U2.ID 
                     WHERE SHIFT.PID = ? AND SHIFT.END_TIME >= ? AND SHIFT.END_TIME <= ?`;
        var AllDetailfinanceResult = await databaseUtils.executeQuery(queryString, [pid, defaultFromDate, defaultToDate]);
        var shiftDetails = AllDetailfinanceResult || [];


        //query to show sales according to ALL nozzle number
        queryString = `SELECT USER.FNAME AS FNAME, NOZZLE.TYPE, NOZZLE.NOZZLE_NUMBER, SHIFT.START_TIME AS START_TIME, SHIFT_NOZZLE_DSM.USER_ID AS USER_ID, (SHIFT_NOZZLE_DSM.DOR - SHIFT_NOZZLE_DSM.DCR - SHIFT_NOZZLE_DSM.PUMP_TEST - SHIFT_NOZZLE_DSM.SELF) AS SALE, SHIFT_COLLECTION.ID AS ID, COLLECTION_MODE.MODE, SHIFT_COLLECTION.AMOUNT 
                    FROM SHIFT 
                    JOIN SHIFT_NOZZLE_DSM ON SHIFT.ID = SHIFT_NOZZLE_DSM.SHIFT_ID 
                    JOIN USER ON USER.ID = SHIFT.SUPERVISOR_ID 
                    JOIN NOZZLE ON SHIFT_NOZZLE_DSM.NOZZLE_ID = NOZZLE.ID 
                    JOIN SHIFT_COLLECTION ON SHIFT_NOZZLE_DSM.ID = SHIFT_COLLECTION.SHIFT_NOZZLE_DSM_ID 
                    JOIN COLLECTION_MODE ON COLLECTION_MODE.ID = SHIFT_COLLECTION.COLLECTION_MODE_ID 
                    WHERE SHIFT.PID = ? AND SHIFT.START_TIME >= ? AND SHIFT.START_TIME <= ? 
                    GROUP BY NOZZLE.NOZZLE_NUMBER, COLLECTION_MODE.MODE`;
        var SalesNozzleResult = await databaseUtils.executeQuery(queryString, [pid, defaultFromDate, defaultToDate]);
        var saleDetails = SalesNozzleResult || [];


        //QUERY TO SHOW SALES ACCORDING TO PARTICULAR NOZZLE NUMBER

        queryString = 'SELECT USER.FNAME AS FNAME,TYPE,NOZZLE_NUMBER,SHIFT.START_TIME AS START_TIME,SHIFT_NOZZLE_DSM.USER_ID AS USER_ID,(DOR-DCR-PUMP_TEST-SELF) AS SALE,SHIFT_COLLECTION.ID AS ID,MODE,AMOUNT FROM SHIFT JOIN SHIFT_NOZZLE_DSM ON SHIFT.ID=SHIFT_NOZZLE_DSM.SHIFT_ID JOIN USER ON USER.ID=SHIFT.SUPERVISOR_ID JOIN NOZZLE ON SHIFT_NOZZLE_DSM.NOZZLE_ID=NOZZLE.ID JOIN SHIFT_COLLECTION ON SHIFT_NOZZLE_DSM.ID=SHIFT_COLLECTION.SHIFT_NOZZLE_DSM_ID JOIN COLLECTION_MODE ON COLLECTION_MODE.ID=SHIFT_COLLECTION.COLLECTION_MODE_ID WHERE SHIFT.PID=? AND NOZZLE_NUMBER=? AND SHIFT.START_TIME>=? AND SHIFT.START_TIME<=?';
        var SalesNozzleResult1 = await databaseUtils.executeQuery(queryString, [pid, nozzle_number, defaultFromDate, defaultToDate]);
        var saleDetails1 = SalesNozzleResult1;

        //show details of all supervisors


        queryString = 'SELECT USER.FNAME AS FNAME,TYPE,NOZZLE_NUMBER,SHIFT.START_TIME AS START_TIME,SHIFT_NOZZLE_DSM.USER_ID AS USER_ID,(DOR-DCR-PUMP_TEST-SELF) AS SALE,SHIFT_COLLECTION.ID AS ID,MODE,AMOUNT FROM SHIFT JOIN SHIFT_NOZZLE_DSM ON SHIFT.ID=SHIFT_NOZZLE_DSM.SHIFT_ID JOIN USER ON USER.ID=SHIFT.SUPERVISOR_ID JOIN NOZZLE ON SHIFT_NOZZLE_DSM.NOZZLE_ID=NOZZLE.ID JOIN SHIFT_COLLECTION ON SHIFT_NOZZLE_DSM.ID=SHIFT_COLLECTION.SHIFT_NOZZLE_DSM_ID JOIN COLLECTION_MODE ON COLLECTION_MODE.ID=SHIFT_COLLECTION.COLLECTION_MODE_ID WHERE SHIFT.PID=? AND SHIFT.START_TIME>=? AND SHIFT.START_TIME<=? group by nozzle_number,mode';
        var SalesSupervisorResult = await databaseUtils.executeQuery(queryString, [pid, defaultFromDate, defaultToDate]);
        var supervisorDetails = SalesSupervisorResult;
        // SHOW DETAILS OF ALL SUPERVISOR

        queryString = 'SELECT USER.FNAME AS FNAME,TYPE,NOZZLE_NUMBER,SHIFT.START_TIME AS START_TIME,SHIFT_NOZZLE_DSM.USER_ID AS USER_ID,(DOR-DCR-PUMP_TEST-SELF) AS SALE,SHIFT_COLLECTION.ID AS ID,MODE,AMOUNT FROM SHIFT JOIN SHIFT_NOZZLE_DSM ON SHIFT.ID=SHIFT_NOZZLE_DSM.SHIFT_ID JOIN USER ON USER.ID=SHIFT.SUPERVISOR_ID JOIN NOZZLE ON SHIFT_NOZZLE_DSM.NOZZLE_ID=NOZZLE.ID JOIN SHIFT_COLLECTION ON SHIFT_NOZZLE_DSM.ID=SHIFT_COLLECTION.SHIFT_NOZZLE_DSM_ID JOIN COLLECTION_MODE ON COLLECTION_MODE.ID=SHIFT_COLLECTION.COLLECTION_MODE_ID WHERE SHIFT.PID=? AND SHIFT.START_TIME>=? AND SHIFT.START_TIME<=? group by user.fname, nozzle_number,mode';
        var SalesSupervisorResult1 = await databaseUtils.executeQuery(queryString, [pid, defaultFromDate, defaultToDate]);
        var supervisorDetails1 = SalesSupervisorResult1;

        //to show details according to all dsm

        queryString = 'SELECT U1.FNAME AS SUPERVISOR,U2.FNAME AS DSM,TYPE,NOZZLE_NUMBER,SHIFT.START_TIME AS START_TIME,SHIFT_NOZZLE_DSM.USER_ID AS USER_ID,(DOR-DCR-PUMP_TEST-SELF) AS SALE,SHIFT_COLLECTION.ID AS ID,MODE,AMOUNT FROM USER U1 JOIN SHIFT ON U1.ID=SHIFT.SUPERVISOR_ID JOIN SHIFT_NOZZLE_DSM ON SHIFT.ID=SHIFT_NOZZLE_DSM.SHIFT_ID JOIN USER U2 ON SHIFT_NOZZLE_DSM.USER_ID=U2.ID JOIN NOZZLE ON SHIFT_NOZZLE_DSM.NOZZLE_ID=NOZZLE.ID JOIN SHIFT_COLLECTION ON SHIFT_NOZZLE_DSM.ID=SHIFT_COLLECTION.SHIFT_NOZZLE_DSM_ID JOIN COLLECTION_MODE ON COLLECTION_MODE.ID=SHIFT_COLLECTION.COLLECTION_MODE_ID WHERE SHIFT.PID=? AND SHIFT.START_TIME>=? AND SHIFT.START_TIME<=?';
        var SalesDSMResult = await databaseUtils.executeQuery(queryString, [pid, defaultFromDate, defaultToDate]);
        var dsmDetails = SalesDSMResult;
        // TO SHOW DETAILS OF ALL DSM


        queryString = 'SELECT U1.FNAME AS SUPERVISOR,U2.FNAME AS DSM,TYPE,NOZZLE_NUMBER,SHIFT.START_TIME AS START_TIME,SHIFT_NOZZLE_DSM.USER_ID AS USER_ID,(DOR-DCR-PUMP_TEST-SELF) AS SALE,SHIFT_COLLECTION.ID AS ID,MODE,AMOUNT FROM USER U1 JOIN SHIFT ON U1.ID=SHIFT.SUPERVISOR_ID JOIN SHIFT_NOZZLE_DSM ON SHIFT.ID=SHIFT_NOZZLE_DSM.SHIFT_ID JOIN USER U2 ON SHIFT_NOZZLE_DSM.USER_ID=U2.ID JOIN NOZZLE ON SHIFT_NOZZLE_DSM.NOZZLE_ID=NOZZLE.ID JOIN SHIFT_COLLECTION ON SHIFT_NOZZLE_DSM.ID=SHIFT_COLLECTION.SHIFT_NOZZLE_DSM_ID JOIN COLLECTION_MODE ON COLLECTION_MODE.ID=SHIFT_COLLECTION.COLLECTION_MODE_ID WHERE SHIFT.PID=? AND SHIFT.START_TIME>=? AND SHIFT.START_TIME<=? GROUP BY NOZZLE_NUMBER,START_TIME,MODE';
        var SalesDSMResult1 = await databaseUtils.executeQuery(queryString, [pid, defaultFromDate, defaultToDate]);
        var dsmDetails1 = SalesDSMResult1;


        await ctx.render('finance', {
            shiftDetails: shiftDetails,
            saleDetails: saleDetails,
            saleDetails1: saleDetails1,
            supervisorDetails: supervisorDetails,
            supervisorDetails1: supervisorDetails1,
            dsmDetails: dsmDetails,
            dsmDetails1: dsmDetails1,
            //   supdsmDetails:supdsmDetails 

        });
    },
    showifinancePage: async (ctx) => {

        var pid;
        try { pid = ctx.currentUser[0].PID; }
        catch (e) { pid = 0; }

        var queryString;
        var query;
        var from;
        var to;
        var nozzle;
        var supervisor;
        var mode;
        var dsm;
        var type;
        var f1;
        var f2;
        var f3;
        var f4;
        var f5;
        try { from = ctx.request.query.from; } catch (e) { }
        try { to = ctx.request.query.to; } catch (e) { }
        try { f1 = ctx.request.query.f1; } catch (e) { }
        try { f2 = ctx.request.query.f2; } catch (e) { }
        try { f3 = ctx.request.query.f3; } catch (e) { }
        try { f4 = ctx.request.query.f4; } catch (e) { }
        try { f5 = ctx.request.query.f5; } catch (e) { }
        try { nozzle = ctx.request.query.nozzle; } catch (e) { }
        try { supervisor = ctx.request.query.supervisor; } catch (e) { }
        try { dsm = ctx.request.query.dsm; } catch (e) { }
        try { mode = ctx.request.query.mode; } catch (e) { }
        try { type = ctx.request.query.type; } catch (e) { }

        console.log(f1, f2, f3, f4, f5, nozzle, supervisor, dsm, mode, type);

        // Set default date range to last 30 days if not provided
        let fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 00:00:00';
        let toDate = to || new Date().toISOString().split('T')[0] + ' 23:59:59';

        let dsmDetails1 = [];

        if (from || to) {
            queryString = 'SELECT U1.FNAME AS SUPERVISOR,U2.FNAME AS DSM,TYPE,NOZZLE_NUMBER,SHIFT.START_TIME AS START_TIME,SHIFT_NOZZLE_DSM.USER_ID AS USER_ID,(DOR-DCR-PUMP_TEST-SELF) AS SALE,SHIFT_COLLECTION.ID AS ID,MODE,AMOUNT FROM USER U1 JOIN SHIFT ON U1.ID=SHIFT.SUPERVISOR_ID JOIN SHIFT_NOZZLE_DSM ON SHIFT.ID=SHIFT_NOZZLE_DSM.SHIFT_ID JOIN USER U2 ON SHIFT_NOZZLE_DSM.USER_ID=U2.ID JOIN NOZZLE ON SHIFT_NOZZLE_DSM.NOZZLE_ID=NOZZLE.ID JOIN SHIFT_COLLECTION ON SHIFT_NOZZLE_DSM.ID=SHIFT_COLLECTION.SHIFT_NOZZLE_DSM_ID JOIN COLLECTION_MODE ON COLLECTION_MODE.ID=SHIFT_COLLECTION.COLLECTION_MODE_ID WHERE SHIFT.PID=? AND SHIFT.START_TIME>=? AND SHIFT.START_TIME<=? GROUP BY NOZZLE_NUMBER,START_TIME,MODE';
            dsmDetails1 = await databaseUtils.executeQuery(queryString, [pid, fromDate, toDate]);
        }
        else {
            queryString = 'SELECT U1.FNAME AS SUPERVISOR,U2.FNAME AS DSM,TYPE,NOZZLE_NUMBER,SHIFT.START_TIME AS START_TIME,SHIFT_NOZZLE_DSM.USER_ID AS USER_ID,(DOR-DCR-PUMP_TEST-SELF) AS SALE,SHIFT_COLLECTION.ID AS ID,MODE,AMOUNT FROM USER U1 JOIN SHIFT ON U1.ID=SHIFT.SUPERVISOR_ID JOIN SHIFT_NOZZLE_DSM ON SHIFT.ID=SHIFT_NOZZLE_DSM.SHIFT_ID JOIN USER U2 ON SHIFT_NOZZLE_DSM.USER_ID=U2.ID JOIN NOZZLE ON SHIFT_NOZZLE_DSM.NOZZLE_ID=NOZZLE.ID JOIN SHIFT_COLLECTION ON SHIFT_NOZZLE_DSM.ID=SHIFT_COLLECTION.SHIFT_NOZZLE_DSM_ID JOIN COLLECTION_MODE ON COLLECTION_MODE.ID=SHIFT_COLLECTION.COLLECTION_MODE_ID WHERE SHIFT.PID=? GROUP BY NOZZLE_NUMBER,START_TIME,MODE';
            dsmDetails1 = await databaseUtils.executeQuery(queryString, [pid]);
            console.log("No date filters applied, fetched all records.");
        }

        var nozzleCountResult = await databaseUtils.executeQuery('SELECT ID,NOZZLE_NUMBER FROM NOZZLE WHERE PID=?', [pid]);

        queryString = `
SELECT U.ID,
       U.FNAME,
       U.LNAME,
       R.TYPE AS TYPE
FROM USER U
JOIN USER_ROLE UR ON U.ID = UR.USER_ID
JOIN ROLE R ON R.ID = UR.ROLE_ID
WHERE U.PID = ?
  AND U.ACTIVE = 1
  AND UPPER(R.TYPE) IN ('SUPERVISOR', 'DSM')
`;

        const availablePersonResult =
            await databaseUtils.executeQuery(queryString, [pid]);
        queryString = 'SELECT ID,MODE FROM COLLECTION_MODE WHERE PID=? ORDER BY MODE';
        var paymentModes = await databaseUtils.executeQuery(queryString, [pid]);

        var queryString = 'SELECT DISTINCT(TYPE) FROM TANK_METADATA WHERE PID=?';
        var tankType = await databaseUtils.executeQuery(queryString, [pid]);
let posSales = await databaseUtils.executeQuery(`
    SELECT
        B.CREATED_AT,
        P.NAME AS PRODUCT_NAME,
        I.QTY,
        I.TOTAL AS AMOUNT
    FROM POS_BILL B
    JOIN POS_BILL_ITEMS I ON I.BILL_ID = B.ID
    LEFT JOIN PRODUCT P ON P.ID = I.PRODUCT_ID
    WHERE B.PID = ?
      AND B.CREATED_AT >= ?
      AND B.CREATED_AT <= ?
    ORDER BY B.CREATED_AT DESC
`, [pid, fromDate, toDate]) || [];
let inventoryAdjustments = await databaseUtils.executeQuery(`
    SELECT 
        SUM(QTY) as QTY,
        SUM(AMOUNT) as AMOUNT,
        SOURCE_TYPE,
        product_type,
        rate,
        TRANSACTION_DATE
    FROM INVENTORY_LEDGER
    WHERE PID = ?
    AND SOURCE_TYPE = 'ADJUSTMENT'
    AND TRANSACTION_DATE >= ?
    AND TRANSACTION_DATE <= ?
    GROUP BY SOURCE_TYPE
`, [pid, fromDate, toDate]);
let purchases = await databaseUtils.executeQuery(`
    SELECT 
        SUM(QTY) as QTY,
        SUM(AMOUNT) as AMOUNT,
        SOURCE_TYPE,
        product_type,
        rate,
        TRANSACTION_DATE
    FROM INVENTORY_LEDGER
    WHERE PID = ?
    AND SOURCE_TYPE = 'PURCHASE'
    AND TRANSACTION_DATE >= ?
    AND TRANSACTION_DATE <= ?
    GROUP BY SOURCE_TYPE
`, [pid, fromDate, toDate]);    
let filteredFuel = dsmDetails1;

if (f1 === '1' && nozzle) {
    filteredFuel = filteredFuel.filter(r => r.NOZZLE_NUMBER == nozzle);
}

if (f2 === '1' && supervisor) {
    filteredFuel = filteredFuel.filter(r => r.SUPERVISOR == supervisor);
}

if (f3 === '1' && dsmName) {
    filteredFuel = filteredFuel.filter(r => r.DSM == dsmName);
}

if (f4 === '1' && mode) {
    filteredFuel = filteredFuel.filter(r => r.MODE == mode);
}

if (f5 === '1' && type) {
    filteredFuel = filteredFuel.filter(r => r.TYPE == type);
}
        await ctx.render('ifinance', {
            dsmDetails1: dsmDetails1,
              filteredFuel: filteredFuel,
                purchases: purchases || [],
            nozzleCountResult: nozzleCountResult,
            posSales: posSales || [],
            inventoryAdjustments: inventoryAdjustments || [],
            availablePersonResult: availablePersonResult,
            paymentModes: paymentModes,
            tankType: tankType,
            from: from,
            to: to,
            f1: f1,
            f2: f2,
            f3: f3,
            f4: f4,
            f5: f5,
            nozzle: nozzle,
            supervisor: supervisor,
            dsm: dsm,
            mode: mode,
            type: type,
            //   supdsmDetails:supdsmDetails 

        });
    },
    logout: async (ctx) => {
        var sessionId = ctx.cookies.get("SESSION_ID");
        if (sessionId) {
            sessionUtils.deleteSession(sessionId);
        }
        ctx.cookies.set("SESSION_ID", '', { expires: new Date(1), path: '/' });

        ctx.redirect('/');
    }
}
