const databaseUtils = require('../utils/databaseUtils');
/* ===========================
   DATASHEET HELPER
=========================== */
async function regenerateDatasheet(tankMetadataId, capacity) {
      capacity = parseFloat(capacity);
    if (!capacity || capacity <= 0) return;

    const maxHeightCm = Math.floor(capacity);
    if (maxHeightCm === 0) return;

    const mmv = capacity / (maxHeightCm * 10);

    await databaseUtils.executeQuery(
        'DELETE FROM DATASHEET WHERE TANK_METADATA_ID = ?',
        [tankMetadataId]
    );

    for (let h = 0; h <= maxHeightCm; h++) {
        const cmv = h * 10 * mmv;

        await databaseUtils.executeQuery(
            `INSERT INTO DATASHEET
             (TANK_METADATA_ID, HEIGHT, CMV, MMV)
             VALUES (?, ?, ?, ?)`,
            [tankMetadataId, h, cmv, mmv]
        );
    }
    console.log(`Datasheet regenerated for TANK_METADATA_ID=${tankMetadataId}`);
}

module.exports = {
    showiTankPage: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const ttype = ctx.request.query.ttype;

            let DetailtankResult;
            if (!ttype || ttype === 'All') {
                DetailtankResult = await databaseUtils.executeQuery(
                    'SELECT ID, CAPACITY, TYPE, ACTIVE FROM TANK_METADATA WHERE PID=?',
                    [pid]
                );
            } else {
                DetailtankResult = await databaseUtils.executeQuery(
                    'SELECT ID, CAPACITY, TYPE, ACTIVE FROM TANK_METADATA WHERE PID=? AND TYPE=?',
                    [pid, ttype]
                );
            }
            DetailtankResult = DetailtankResult || [];

            const tankType = await databaseUtils.executeQuery(
                'SELECT DISTINCT(TYPE) FROM TANK_METADATA WHERE PID=?',
                [pid]
            ) || [];

            await ctx.render('itank', {
                DetailtankResult: DetailtankResult,
                tankType: tankType,
                ttype: ttype
            });
        } catch (error) {
            console.error('Error in showiTankPage:', error);
            await ctx.render('itank', {
                DetailtankResult: [],
                tankType: [],
                ttype: ctx.request.query.ttype
            });
        }
    },

    showiTank2Page: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const body = ctx.request.body || {};
            const tid = body.tid;
            const cap = body.capacity;
            const type = body.type;

            if (tid && cap && type) {
                await databaseUtils.executeQuery(
                    'UPDATE TANK_METADATA SET CAPACITY=?, TYPE=? WHERE ID=?',
                    [cap, type, tid]
                );
                  //  const tankId = DetailtankResult.insertId || DetailtankResult.lastInsertRowid;

                    await regenerateDatasheet(tid, cap);

            }

            const pid_body = body.pid;
            const cap_body = body.capacity;
            const type_body = body.type;

            if (pid_body && cap_body && type_body) {
              DetailtankResult=   await databaseUtils.executeQuery(
                    'INSERT INTO TANK_METADATA (PID, CAPACITY, TYPE) VALUES (?, ?, ?)',
                    [pid_body, cap_body, type_body]
                );
                                   const tankId = DetailtankResult.insertId || DetailtankResult.lastInsertRowid;

                    await regenerateDatasheet(tankId, cap_body);

            }

            const wf = body.ttype;
            let DetailtankResult;

            if (wf === 'all') {
                DetailtankResult = await databaseUtils.executeQuery(
                    'SELECT ID, CAPACITY, TYPE, ACTIVE FROM TANK_METADATA WHERE PID=?',
                    [pid]
                );
            } else if (wf) {
                DetailtankResult = await databaseUtils.executeQuery(
                    'SELECT ID, CAPACITY, TYPE, ACTIVE FROM TANK_METADATA WHERE PID=? AND TYPE=?',
                    [pid, wf]
                );
            } else {
                DetailtankResult = await databaseUtils.executeQuery(
                    'SELECT ID, CAPACITY, TYPE, ACTIVE FROM TANK_METADATA WHERE PID=?',
                    [pid]
                );
            }

            const tankType = await databaseUtils.executeQuery(
                'SELECT DISTINCT(TYPE) FROM TANK_METADATA WHERE PID=?',
                [pid]
            );

            ctx.redirect('/app/itank');
        } catch (error) {
            console.error('Error in showiTank2Page:', error);
            ctx.redirect('/app/itank');
        }
    },

    showiTank3Page: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const body = ctx.request.body || {};
            const cap = body.capacity;
            const type = body.type;
            const act = (body.tid || '').split(' ');

            if (parseInt(act[0]) === 1) {
                // ADD
                if (cap && type) {
                 DetailtankResult=    await databaseUtils.executeQuery(
                        'INSERT INTO TANK_METADATA (PID, CAPACITY, TYPE) VALUES (?, ?, ?)',
                        [pid, cap, type]
                    );
                                       const tankId = DetailtankResult.insertId || DetailtankResult.lastInsertRowid;

                    await regenerateDatasheet(tankId, cap);

                    
                }
            } else if (parseInt(act[0]) === 2) {
                // EDIT
                const tid = parseInt(act[1]);
                if (cap && type && tid) {
                  await databaseUtils.executeQuery(
                        'UPDATE TANK_METADATA SET CAPACITY=?, TYPE=? WHERE ID=?',
                        [cap, type, tid]
                    );
                       //                const tankId = DetailtankResult.insertId || DetailtankResult.lastInsertRowid;

                    await regenerateDatasheet(tid, cap);

                }
            } else {
                // TOGGLE ACTIVE
                const tid = parseInt(act[2]);
                const active = parseInt(act[1]);
                if (tid) {
                     await databaseUtils.executeQuery(
                        'UPDATE TANK_METADATA SET ACTIVE=? WHERE ID=?',
                        [active, tid]
                    );
               
                }
            }

            ctx.redirect('/app/itank');
        } catch (error) {
            console.error('Error in showiTank3Page:', error);
            ctx.redirect('/app/itank');
        }
    }
};
