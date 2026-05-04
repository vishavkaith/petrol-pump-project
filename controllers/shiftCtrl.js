const sessionUtils = require('../utils/sessionUtils');
const util = require('util');
const databaseUtils = require('../utils/databaseUtils');

module.exports = {

    // =========================
    // SHOW SHIFT PAGE
    // =========================
    showShiftpage: async (ctx) => {
        let pid;
        try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

        let queryString;

        queryString = `
            SELECT SHIFT_TYPE, TIME(STARTTIME) AS START, TIME(ENDTIME) AS END
            FROM SHIFT_METADATA WHERE PID=?
        `;
        const availableShiftResult = await databaseUtils.executeQuery(queryString, [pid]);

        queryString = `
            SELECT U.ID, U.FNAME, U.LNAME
            FROM USER U
            JOIN USER_ROLE UR ON U.ID = UR.USER_ID
            JOIN ROLE R ON R.ID = UR.ROLE_ID
            WHERE U.PID=? AND UPPER(R.TYPE)='SUPERVISOR' AND U.ACTIVE=1
        `;
        const availableSupervisorResult = await databaseUtils.executeQuery(queryString, [pid]);

        queryString = `SELECT NOZZLE_NUMBER FROM NOZZLE WHERE PID=? AND ACTIVE=1`;
        const availableNozzleResult = await databaseUtils.executeQuery(queryString, [pid]);

        queryString = `
            SELECT U.FNAME, U.LNAME
            FROM USER U
            JOIN USER_ROLE UR ON U.ID = UR.USER_ID
            JOIN ROLE R ON R.ID = UR.ROLE_ID
            WHERE U.PID=? AND UPPER(R.TYPE)='DSM' AND U.ACTIVE=1
        `;
        const availableDSMResult = await databaseUtils.executeQuery(queryString, [pid]);

      /*  queryString = `
            SELECT N.NOZZLE_NUMBER, N.TYPE, U1.FNAME AS SUPERVISOR, U2.FNAME AS DSM,
                   S.START_TIME, S.END_TIME, SND.DOR
            FROM SHIFT_NOZZLE_DSM SND
            JOIN SHIFT S ON SND.SHIFT_ID = S.ID
            JOIN NOZZLE N ON N.ID = SND.NOZZLE_ID
            JOIN USER U1 ON U1.ID = S.SUPERVISOR_ID
            JOIN USER U2 ON U2.ID = SND.USER_ID
            WHERE SND.DCR=0 AND S.PID=?
        `;
        const endShiftResult = await databaseUtils.executeQuery(queryString, [pid]);*/
queryString = `
    SELECT 
        S.ID AS SHIFT_ID,
        SM.SHIFT_TYPE,
        S.START_TIME,
        U.FNAME,
        U.LNAME
    FROM SHIFT S
    JOIN SHIFT_METADATA SM ON SM.ID = S.SHIFT_META_DATA_ID
    JOIN USER U ON U.ID = S.SUPERVISOR_ID
    WHERE S.PID=? 
      AND EXISTS (
          SELECT 1 FROM SHIFT_NOZZLE_DSM SND
          WHERE SND.SHIFT_ID = S.ID
            AND SND.DCR = 0
      )
    ORDER BY S.ID DESC
    LIMIT 1
`;
const endShiftHeaderResult =
    await databaseUtils.executeQuery(queryString, [pid]) || [];
   
    queryString = `
            SELECT S.ID, SM.SHIFT_TYPE, U1.FNAME AS SUPERVISOR,
                   S.START_TIME, S.END_TIME
            FROM SHIFT_METADATA SM
            JOIN SHIFT S ON SM.ID = S.SHIFT_META_DATA_ID
            JOIN USER U1 ON S.SUPERVISOR_ID = U1.ID
            JOIN SHIFT_NOZZLE_DSM SND ON S.ID = SND.SHIFT_ID
            WHERE SND.DCR != 0 AND S.PID=?
            GROUP BY S.ID
        `;
        const viewShiftResult = await databaseUtils.executeQuery(queryString, [pid]);

        await ctx.render('shift', {
            availableShiftResult,
            availableSupervisorResult,
            availableNozzleResult,
            availableDSMResult,
  //          endShiftResult,
            endShiftHeaderResult,
            viewShiftResult
        });
    },

    // =========================
    // LOGOUT
    // =========================
    logout: async (ctx) => {
        const sessionId = ctx.cookies.get("SESSION_ID");
        if (sessionId) sessionUtils.deleteSession(sessionId);
        ctx.cookies.set("SESSION_ID", '', { expires: new Date(1), path: '/' });
        ctx.redirect('/');
    },

    // =========================
    // SHOW I-SHIFT PAGE
    // =========================
    showiShiftPage: async (ctx) => {
        console.log('🔥 HIT showiShiftPage');

        let pid;
        try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

        let queryString;

        // Available shifts for today
        queryString = `
            SELECT *
            FROM SHIFT_METADATA SM
            WHERE NOT EXISTS (
                SELECT 1 FROM SHIFT S
                WHERE S.SHIFT_META_DATA_ID=SM.ID
                AND DATE(S.START_TIME)=CURRENT_DATE
            )
            AND PID=?
        `;
        const availableShiftResult = await databaseUtils.executeQuery(queryString, [pid]) || [];

        // Available Supervisors/DSM
        queryString = `
    SELECT DISTINCT
        U.ID,
        U.FNAME,
        U.LNAME,
        UPPER(TRIM(R.TYPE)) AS TYPE
    FROM USER U
    JOIN USER_ROLE UR ON U.ID = UR.USER_ID
    JOIN ROLE R ON R.ID = UR.ROLE_ID
    WHERE U.PID = ?
      AND U.ACTIVE = 1
      AND UPPER(TRIM(R.TYPE)) IN ('SUPERVISOR', 'DSM')
`;

const availableSupervisorResult =
    await databaseUtils.executeQuery(queryString, [pid]) || [];

console.log('DEBUG availableSupervisorResult:', availableSupervisorResult);

        // Available nozzles with readings
       queryString = `
    SELECT 
        N.ID,
        N.NOZZLE_NUMBER,
        COALESCE(SND.DOR, 0) AS DOR,
        COALESCE(SND.AOR, 0) AS AOR
    FROM NOZZLE N
    LEFT JOIN SHIFT_NOZZLE_DSM SND 
        ON N.ID = SND.NOZZLE_ID
       AND SND.SHIFT_ID = (
            SELECT MAX(ID) 
            FROM SHIFT 
            WHERE PID=?
       )
    WHERE N.PID=? 
      AND N.ACTIVE=1
    ORDER BY N.NOZZLE_NUMBER
`;
let availableNozzleResult1 =
    await databaseUtils.executeQuery(queryString, [pid, pid]) || [];
     /*   if (!availableNozzleResult.length) {
            queryString = `SELECT ID, NOZZLE_NUMBER, 0 AS DOR, 0 AS AOR FROM NOZZLE WHERE PID=? AND ACTIVE=1`;
            availableNozzleResult = await databaseUtils.executeQuery(queryString, [pid]) || [];
        }*/

        // Tank readings for current shift
        queryString = `
            SELECT T.TANK_ID, TM.TYPE, COALESCE(T.CLOSE_READING, 0) AS CLOSE_READING
            FROM TANK T
            JOIN TANK_METADATA TM ON T.TANK_ID = TM.ID
            WHERE T.PID=? AND T.SHIFT_ID=(SELECT MAX(ID) FROM SHIFT WHERE PID=?)
            ORDER BY TM.TYPE
        `;
        let tanksResult = await databaseUtils.executeQuery(queryString, [pid, pid]) || [];

        if (!tanksResult.length) {
            queryString = `SELECT ID as TANK_ID, TYPE, 0 AS CLOSE_READING FROM TANK_METADATA WHERE PID=? ORDER BY TYPE`;
            tanksResult = await databaseUtils.executeQuery(queryString, [pid]) || [];
        }

        // Get first shift to be ended
      /*  queryString = `
            SELECT U.FNAME, U.LNAME, SND.SHIFT_ID, SND.NOZZLE_ID, SND.USER_ID,
                   SND.DOR, SND.DCR, SND.AOR, SND.ACR, SND.PUMP_TEST, SND.SELF
            FROM SHIFT_NOZZLE_DSM SND
            JOIN USER U ON U.ID = SND.USER_ID
            WHERE SND.SHIFT_ID=(
                SELECT SHIFT_ID FROM SHIFT_NOZZLE_DSM
                WHERE PID=? AND DCR=0 AND ACR=0
                ORDER BY ID LIMIT 1
            )
        `;
        const endShiftResult = await databaseUtils.executeQuery(queryString, [pid]) || [];*/
        // =========================
// END SHIFT HEADER (LATEST OPEN SHIFT)
// =========================
queryString = `
    SELECT 
        S.ID AS SHIFT_ID,
        SM.SHIFT_TYPE,
        S.START_TIME,
        U.FNAME,
        U.LNAME
    FROM SHIFT S
    JOIN SHIFT_METADATA SM ON SM.ID = S.SHIFT_META_DATA_ID
    JOIN USER U ON U.ID = S.SUPERVISOR_ID
    WHERE S.PID=? 
      AND EXISTS (
          SELECT 1 FROM SHIFT_NOZZLE_DSM SND
          WHERE SND.SHIFT_ID = S.ID
            AND SND.DCR = 0
      )
    ORDER BY S.ID DESC
    LIMIT 1
`;

const endShiftHeaderResult =
    await databaseUtils.executeQuery(queryString, [pid]) || [];
queryString = `
    SELECT 
        SND.NOZZLE_ID,
        SND.USER_ID,
        U.FNAME,
        U.LNAME,
        SND.DOR, SND.DCR,
        SND.AOR, SND.ACR,
        SND.PUMP_TEST,
        SND.SELF
    FROM SHIFT_NOZZLE_DSM SND
    JOIN USER U ON U.ID = SND.USER_ID
    WHERE SND.SHIFT_ID=?
      AND SND.DCR=0
`;
const endShiftNozzleResult =
    endShiftHeaderResult.length
        ? await databaseUtils.executeQuery(
            queryString,
            [endShiftHeaderResult[0].SHIFT_ID]
          )
        : [];
        // Payment modes
        const paymentModes = await databaseUtils.executeQuery(
            'SELECT ID, MODE FROM COLLECTION_MODE WHERE PID=? ORDER BY MODE', [pid]
        ) || [];

        // Tank opening readings
        queryString = `
            SELECT T.TANK_ID, TM.TYPE, COALESCE(T.OPEN_READING, 0) AS OPEN_READING
            FROM TANK T
            JOIN TANK_METADATA TM ON T.TANK_ID = TM.ID
            WHERE T.PID=? AND T.SHIFT_ID=(SELECT MAX(ID) FROM SHIFT WHERE PID=?)
            ORDER BY TM.TYPE
        `;
        let tanksResult1 = await databaseUtils.executeQuery(queryString, [pid, pid]) || [];

        if (!tanksResult1.length) {
            queryString = `SELECT ID as TANK_ID, TYPE, 0 AS OPEN_READING FROM TANK_METADATA WHERE PID=? ORDER BY TYPE`;
            const fallbackTanks = await databaseUtils.executeQuery(queryString, [pid]) || [];
            tanksResult1 = fallbackTanks;
        }

        // Get filter parameters
        const dateactive = ctx.request.query.dateactive;
        const countactive = ctx.request.query.countactive;
        const status = ctx.request.query.status || '';
        const supervisor = ctx.request.query.supervisor || '';
        let from = '', to = '', count = '';
        let viewShiftResult = [];

        if (dateactive && countactive) {
            from = ctx.request.query.from;
            to = ctx.request.query.to;
            count = ctx.request.query.count;
            queryString = `
                SELECT S.ID, S.START_TIME, S.END_TIME, U.FNAME, U.LNAME
                FROM SHIFT S
                JOIN USER U ON U.ID = S.SUPERVISOR_ID
                WHERE S.PID=? AND S.START_TIME>=? AND S.START_TIME<=?
                LIMIT ?
            `;
            viewShiftResult = await databaseUtils.executeQuery(queryString, [pid, from, to, count]) || [];
        } else if (dateactive) {
            from = ctx.request.query.from;
            to = ctx.request.query.to;
            queryString = `
                SELECT S.ID, S.START_TIME, S.END_TIME, U.FNAME, U.LNAME
                FROM SHIFT S
                JOIN USER U ON U.ID = S.SUPERVISOR_ID
                WHERE S.PID=? AND S.START_TIME>=? AND S.START_TIME<=?
            `;
            viewShiftResult = await databaseUtils.executeQuery(queryString, [pid, from, to]) || [];
        } else if (countactive) {
            count = ctx.request.query.count;
            queryString = `
                SELECT S.ID, S.START_TIME, S.END_TIME, U.FNAME, U.LNAME
                FROM SHIFT S
                JOIN USER U ON U.ID = S.SUPERVISOR_ID
                WHERE S.PID=?
                LIMIT ?
            `;
            viewShiftResult = await databaseUtils.executeQuery(queryString, [pid, count]) || [];
        } else {
            queryString = `
                SELECT S.ID, S.START_TIME, S.END_TIME, U.FNAME, U.LNAME
                FROM SHIFT S
                JOIN USER U ON U.ID = S.SUPERVISOR_ID
                WHERE S.PID=?
            `;
            viewShiftResult = await databaseUtils.executeQuery(queryString, [pid]) || [];
        }

        // Transports & Fuels
        const transports = await databaseUtils.executeQuery('SELECT * FROM TRANSPORT WHERE PID=?', [pid]) || [];
        const fuels = await databaseUtils.executeQuery('SELECT * FROM TANK_METADATA WHERE PID=?', [pid]) || [];

        await ctx.render('ishift', {
            availableShiftResult,
            availableSupervisorResult,
            availableNozzleResult1,
            endShiftHeaderResult,
            endShiftNozzleResult,
            paymentModes,
            viewShiftResult,
            tanksResult,
            tanksResult1,
            countactive,
            dateactive,
            status,
            supervisor,
            from,
            to,
            count,
            transports,
            fuels
        });
    },

    // =========================
    // POST I-SHIFT (CRITICAL)
    // =========================
    showiShift2Page: async (ctx) => {
        let pid;
        try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

        // KEEP LOGIC SAME – ONLY SAFETY
        console.log('POST /ishift body:', ctx.request.body);

        const body = ctx.request.body || {};
        const act = (body.act || '').split(' ');
        const action = parseInt(act[0]);
        const nozzleCount = parseInt(act[1]) || 0;
        const tankCount = parseInt(act[2]) || 0;

        try {
            // ======================
            // CREATE SHIFT
            // ======================
            if (action === 1) {
                const shiftTypeId = body.stype;
                const supervisorId = body.supervisor;

                if (!shiftTypeId || !supervisorId) {
                    console.error('Missing required fields:', { shiftTypeId, supervisorId });
                    ctx.redirect('/app/ishift');
                    return;
                }

                // Insert SHIFT
                let queryString = `
                    INSERT INTO SHIFT (PID, SHIFT_META_DATA_ID, SUPERVISOR_ID, START_TIME, END_TIME)
VALUES (?, ?, ?, CURRENT_TIMESTAMP, NULL)
                `;
                const shiftRes = await databaseUtils.executeQuery(queryString, [pid, shiftTypeId, supervisorId]);
                const shiftId = shiftRes.lastInsertRowid;
                console.log('✅ Shift created:', { shiftId, shiftTypeId, supervisorId });

              /*  // Insert SHIFT_NOZZLE_DSM rows
                for (let i = 0; i < nozzleCount; i++) {
                    const userId = body[`user${i}`];
                    const dor = parseFloat(body[`dor${i}`]) || 0;
                    const aor = parseFloat(body[`aor${i}`]) || 0;

                    if (!userId) continue;

                    // Get nozzle ID directly
                    const nozzleQuery = `
                        SELECT ID FROM NOZZLE
                        WHERE PID=? AND ACTIVE=1
                        LIMIT 1 OFFSET ?
                    `;
                    const nozzleRows = await databaseUtils.executeQuery(nozzleQuery, [pid, i]);
                    if (!nozzleRows || !nozzleRows[0]) continue;
                    const nozzleId = nozzleRows[0].ID;

                    queryString = `
                        INSERT INTO SHIFT_NOZZLE_DSM (PID, SHIFT_ID, NOZZLE_ID, USER_ID, DOR, AOR, DCR, ACR)
                        VALUES (?, ?, ?, ?, ?, ?, 0, 0)
                    `;
                    await databaseUtils.executeQuery(queryString, [pid, shiftId, nozzleId, userId, dor, aor]);
                    console.log('✅ Nozzle DSM added:', { i, userId, dor, aor });
                }*/
               // Insert SHIFT_NOZZLE_DSM rows
for (let i = 0; i < nozzleCount; i++) {
    const userId   = body[`user${i}`];
    const nozzleId = parseInt(body[`nozzleId${i}`], 10);

    // --- Strict numeric parsing ---
    const aorRaw = body[`aor${i}`];
    const dorRaw = body[`dor${i}`];

    const aor = aorRaw !== '' && aorRaw != null ? parseFloat(aorRaw) : 0;
    const dor = dorRaw !== '' && dorRaw != null ? parseFloat(dorRaw) : 0;

    if (!userId || !nozzleId) {
        console.warn('Skipping nozzle row:', { i, userId, nozzleId });
        continue;
    }

    if (Number.isNaN(aor) || Number.isNaN(dor)) {
        console.warn('Invalid AOR/DOR, defaulting to 0:', { i, aorRaw, dorRaw });
    }

    const queryString = `
        INSERT INTO SHIFT_NOZZLE_DSM
        (PID, SHIFT_ID, NOZZLE_ID, USER_ID, DOR, AOR, DCR, ACR)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0)
    `;

    await databaseUtils.executeQuery(queryString, [
        pid,
        shiftId,
        nozzleId,
        userId,
        dor,
        aor
    ]);

    console.log('✅ Nozzle DSM added:', {
        nozzleId,
        userId,
        aor,
        dor
    });
}

                // Insert TANK rows
                for (let i = 0; i < tankCount; i++) {
                    const closeReading = parseFloat(body[`cr${i}`]) || 0;

                    // Get tank metadata ID directly
                    const tankQuery = `
                        SELECT ID FROM TANK_METADATA
                        WHERE PID=? AND ACTIVE=1
                        LIMIT 1 OFFSET ?
                    `;
                    const tankRows = await databaseUtils.executeQuery(tankQuery, [pid, i]);
                    if (!tankRows || !tankRows[0]) continue;
                    const tankId = tankRows[0].ID;

                    queryString = `
                        INSERT INTO TANK (PID, SHIFT_ID, TANK_ID, OPEN_READING, CLOSE_READING)
                        VALUES (?, ?, ?, 0, ?)
                    `;
                    await databaseUtils.executeQuery(queryString, [pid, shiftId, tankId, closeReading]);
                    console.log('✅ Tank entry added:', { i, closeReading });
                }

                console.log('✅ Shift creation completed successfully');
            }
            // ======================
// END SHIFT
// ======================
 console.log('🔥 END SHIFT HIT',action);

if (action === 2) {
    const nozzleCount = parseInt(act[1], 10);
    const shiftId     = parseInt(act[2], 10);
    const payModeCnt  = parseInt(act[3], 10);

    console.log('ENDING SHIFT', { shiftId, nozzleCount, payModeCnt });
    //const shiftId = body.shiftId;
 console.log('🔥 END SHIFT HIT');
    console.log('shiftId here:', body.shiftId);
    console.log('nozzleCount:', nozzleCount);   
     if (!shiftId) {
        console.error('❌ Missing shiftId for End Shift');
        ctx.redirect('/app/ishift');
        return;
    }

  try {
    /* --------------------------------------------------
       1️⃣ FETCH REQUIRED MASTER DATA
    -------------------------------------------------- */

    const nozzles = await databaseUtils.executeQuery(
      `SELECT ID FROM NOZZLE WHERE PID = ? ORDER BY NOZZLE_NUMBER`,
      [pid]
    );

    const collectionModes = await databaseUtils.executeQuery(
      `SELECT ID FROM COLLECTION_MODE WHERE PID = ? ORDER BY MODE`,
      [pid]
    );

    const shiftNozzles = await databaseUtils.executeQuery(
      `SELECT ID FROM SHIFT_NOZZLE_DSM WHERE SHIFT_ID = ? ORDER BY NOZZLE_ID`,
      [shiftId]
    );

    const tanks = await databaseUtils.executeQuery(
      `SELECT ID FROM TANK_METADATA WHERE PID = ? ORDER BY TYPE`,
      [pid]
    );

    /* --------------------------------------------------
       2️⃣ UPDATE NOZZLE CLOSING READINGS
    -------------------------------------------------- */

    for (let i = 0; i < nozzles.length; i++) {
      const acr  = parseFloat(body[`acr${i}`])  || 0;
      const dcr  = parseFloat(body[`dcr${i}`])  || 0;
      const pt   = parseFloat(body[`pt${i}`])   || 0;
      const self = parseFloat(body[`self${i}`]) || 0;

      await databaseUtils.executeQuery(
        `
        UPDATE SHIFT_NOZZLE_DSM
        SET ACR = ?, DCR = ?, PUMP_TEST = ?, SELF = ?
        WHERE SHIFT_ID = ? AND NOZZLE_ID = ?
        `,
        [acr, dcr, pt, self, shiftId, nozzles[i].ID]
      );
    }

    /* --------------------------------------------------
       3️⃣ INSERT SHIFT COLLECTION
    -------------------------------------------------- */

    for (let i = 0; i < nozzles.length; i++) {
      for (let j = 0; j < collectionModes.length; j++) {
        const amt = parseFloat(body[`amt_${i}_${j}`]) || 0;

        await databaseUtils.executeQuery(
          `
          INSERT INTO SHIFT_COLLECTION
          (SHIFT_NOZZLE_DSM_ID, COLLECTION_MODE_ID, AMOUNT, PID)
          VALUES (?, ?, ?, ?)
          `,
          [shiftNozzles[i].ID, collectionModes[j].ID, amt, pid]
        );
      }
    }

    /* --------------------------------------------------
       4️⃣ UPDATE TANK CLOSE READING
    -------------------------------------------------- */

    for (let i = 0; i < tanks.length; i++) {
      const cr = parseFloat(body[`cr${i}`]) || 0;

      await databaseUtils.executeQuery(
        `
        UPDATE TANK
        SET CLOSE_READING = ?
        WHERE TANK_ID = ? AND SHIFT_ID = ?
        `,
        [cr, tanks[i].ID, shiftId]
      );
    }

    /* --------------------------------------------------
       5️⃣ FUEL RECEIPT (OPTIONAL)
    -------------------------------------------------- */

    if (body.fuelreceived) {
      await databaseUtils.executeQuery(
        `
        INSERT INTO FUEL_RECEIPT
        (PID, TT, TID, PRO_ID, INVOICE_NO, INVOICE_DATE,
         INVOICE_AMOUNT, INVOICE_QTY, INVOICE_TEMP, RO_TEMP,
         INVOICE_DENSITY, RO_COMPOSITE_DENSITY, TVA, SHORT_REPORT,
         FREIGHT_INVOICE_NO, FREIGHT_INVOICE_AMOUNT)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          pid,
          body.ttno,
          body.transport,
          body.product,
          body.invoiceno,
          body.invoicedate,
          body.invoiceamount,
          body.invoiceqty,
          body.invoicetemp,
          body.rotemp,
          body.invoicedensity,
          body.rodensity,
          body.tva,
          body.short,
          body.finvoiceno,
          body.finvoiceamount
        ]
      );
      // 📈 Insert PURCHASE into ledger
const purchaseQty = parseFloat(body.invoiceqty) || 0;

if (purchaseQty > 0) {
  await databaseUtils.executeQuery(
    `
    INSERT INTO INVENTORY_LEDGER
    (PID, PRODUCT_TYPE, TRANSACTION_DATE, SOURCE_TYPE, SOURCE_ID, QTY)
    VALUES (?, ?, ?, 'PURCHASE', ?, ?)
    `,
    [
      pid,
      body.product,         // product type
      body.invoicedate,     // use invoice date
      shiftId,
      purchaseQty           // positive
    ]
  );
}
    }

    /* --------------------------------------------------
       6️⃣ BALANCE CALCULATION
    -------------------------------------------------- */

    const toUpdate = await databaseUtils.executeQuery(
      `
      SELECT CM.ID AS MODE, SUM(SC.AMOUNT) AS CRDB
      FROM SHIFT S
      JOIN SHIFT_NOZZLE_DSM SND ON S.ID = SND.SHIFT_ID
      JOIN SHIFT_COLLECTION SC ON SND.ID = SC.SHIFT_NOZZLE_DSM_ID
      JOIN COLLECTION_MODE CM ON SC.COLLECTION_MODE_ID = CM.ID
      WHERE S.PID = ? AND S.ID = ?
      GROUP BY CM.ID
      `,
      [pid, shiftId]
    );

    const oldBal = await databaseUtils.executeQuery(
      `
      SELECT B.MODE, B.BAL
      FROM BALANCE B
      WHERE B.PID = ?
      AND B.SID = (SELECT MAX(SID) FROM BALANCE WHERE PID = ?)
      ORDER BY B.MODE
      `,
      [pid, pid]
    );

    for (const row of toUpdate) {
      const prev = oldBal.find(b => b.MODE === row.MODE);
      const prevBal = prev ? prev.BAL : 0;

      await databaseUtils.executeQuery(
        `
        INSERT INTO BALANCE (CRDB, BAL, PID, MODE, SID)
        VALUES (?, ?, ?, ?, ?)
        `,
        [row.CRDB, row.CRDB + prevBal, pid, row.MODE, shiftId]
      );
    }
/* --------------------------------------------------
   6.5️⃣ POS SALE SUMMARY (Non-Fuel Products)
-------------------------------------------------- */

const posSummary = await databaseUtils.executeQuery(
  `
  SELECT 
      COUNT(*) AS TOTAL_BILLS,
      COALESCE(SUM(TOTAL_AMOUNT),0) AS POS_TOTAL
  FROM POS_BILL
  WHERE SHIFT_ID = ?
  `,
  [shiftId]
);

console.log('🧾 POS SUMMARY:', posSummary);
    /* --------------------------------------------------
       7️⃣ CLOSE SHIFT
    -------------------------------------------------- */
    // 🧹 Delete old ledger entries for this shift (important for edit safety)
await databaseUtils.executeQuery(
  `
  DELETE FROM INVENTORY_LEDGER
  WHERE SOURCE_TYPE IN ('SHIFT_SALE')
  AND SOURCE_ID = ?
  `,
  [shiftId]
);
// 📉 Insert SHIFT SALE into ledger
const saleSummary = await databaseUtils.executeQuery(
  `
  SELECT N.TYPE AS PRODUCT,
         SUM(SND.DCR - SND.DOR - SND.PUMP_TEST- SND.SELF) AS SALE
  FROM SHIFT_NOZZLE_DSM SND
  JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID
  WHERE SND.SHIFT_ID = ?
  GROUP BY N.TYPE
  `,
  [shiftId]
);

const shiftInfo = await databaseUtils.executeQuery(
  `SELECT START_TIME FROM SHIFT WHERE ID = ?`,
  [shiftId]
);

const transactionDate = shiftInfo[0].START_TIME;

for (const row of saleSummary) {
  const qty = parseFloat(row.SALE) || 0;

  if (qty === 0) continue;

  await databaseUtils.executeQuery(
    `
    INSERT INTO INVENTORY_LEDGER
    (PID, PRODUCT_TYPE, TRANSACTION_DATE, SOURCE_TYPE, SOURCE_ID, QTY)
    VALUES (?, ?, ?, 'SHIFT_SALE', ?, ?)
    `,
    [
      pid,
      row.PRODUCT,
      transactionDate,
      shiftId,
      -qty   // negative for sale
    ]
  );
}
    await databaseUtils.executeQuery(
      `UPDATE SHIFT SET END_TIME = CURRENT_TIMESTAMP WHERE ID = ?`,
      [shiftId]
    );

    console.log('✅ Shift closed successfully:', shiftId);
    ctx.redirect('/app/ishift');

  } catch (err) {
    console.error('❌ End Shift Failed', err);
    ctx.throw(500, 'End Shift Failed');
  }
}

        } catch (error) {
            console.error('❌ Error in showiShift2Page:', error);
        }

        ctx.redirect('/app/ishift');
    },

    // =========================
    // SCHEDULE
    // =========================
    showiSchedulePage: async (ctx) => {
        let pid;
        try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

        const ScheduleResult = await databaseUtils.executeQuery(`
    SELECT 
        SM.ID,
        TIME(SM.STARTTIME) AS STARTTIME,
        TIME(SM.ENDTIME) AS ENDTIME,
        SM.SHIFT_TYPE,
        SM.SID AS SUPERVISOR_ID,
        U.FNAME,
        U.LNAME,
        SM.ACTIVE
    FROM SHIFT_METADATA SM
    JOIN USER U ON U.ID = SM.SID
    WHERE SM.PID=?
    ORDER BY SM.STARTTIME ASC
`, [pid]) || [];

        const availableSupervisorResult = await databaseUtils.executeQuery(`
            SELECT U.ID, U.FNAME
            FROM USER U
            JOIN USER_ROLE UR ON U.ID = UR.USER_ID
            JOIN ROLE R ON R.ID = UR.ROLE_ID
            WHERE U.PID=? AND UPPER(R.TYPE)='SUPERVISOR'
            ORDER BY U.FNAME ASC
        `, [pid]) || [];

        await ctx.render('ischedule', {
            ScheduleResult,
            availableSupervisorResult
        });
    },

    // =========================
    // POST SCHEDULE (ADD/EDIT/DELETE)
    // =========================
    showiSchedule2Page: async (ctx) => {
        let pid;
        try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

        const body = ctx.request.body || {};
        const scid = body.scid || '';
        const sid = body.sid;
        const starttime = body.starttime;
        const endtime = body.endtime;
        const shifttype = body.shifttype;
        
        const act = scid.split(' ');

        try {
            // ======================
            // ADD NEW SCHEDULE
            // ======================
            if (parseInt(act[0]) === 1) {
                const queryString = `
                    INSERT INTO SHIFT_METADATA (PID, STARTTIME, ENDTIME, SHIFT_TYPE, SID)
                    VALUES (?, CONCAT(CURRENT_DATE, ' ', ?), CONCAT(CURRENT_DATE, ' ', ?), ?, ?)
                `;
                await databaseUtils.executeQuery(queryString, [pid, starttime, endtime, shifttype, sid]);
                console.log('✅ Schedule added:', { pid, starttime, endtime, shifttype, sid });
            }
            // ======================
            // EDIT SCHEDULE
            // ======================
            else if (parseInt(act[0]) === 2) {
                const scheduleId = parseInt(act[1]);
                const queryString = `
                    UPDATE SHIFT_METADATA
                    SET STARTTIME=CONCAT(CURRENT_DATE, ' ', ?),
                        ENDTIME=CONCAT(CURRENT_DATE, ' ', ?),
                        SID=?
                    WHERE ID=? AND PID=?
                `;
                await databaseUtils.executeQuery(queryString, [starttime, endtime, sid, scheduleId, pid]);
                console.log('✅ Schedule updated:', { scheduleId, starttime, endtime, sid });
            }
            // ======================
            // TOGGLE ACTIVE STATUS
            // ======================
            else if (parseInt(act[0]) === 3) {
                const scheduleId = parseInt(act[2]);
                const activeStatus = parseInt(act[1]) === 0 ? 1 : 0;
                await databaseUtils.executeQuery(
                    'UPDATE SHIFT_METADATA SET ACTIVE=? WHERE ID=? AND PID=?',
                    [activeStatus, scheduleId, pid]
                );
                console.log('✅ Schedule status toggled:', { scheduleId, activeStatus });
            }
        } catch (error) {
            console.error('❌ Error in showiSchedule2Page:', error);
        }

        ctx.redirect('/app/ischedule');
    }

};
