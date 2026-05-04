const databaseUtils = require('../utils/databaseUtils');

module.exports = {
    showiNozzlePage: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const ntype = ctx.request.query.ntype;

            let nozzleDetails;
            if (ntype && ntype !== 'All') {
                nozzleDetails = await databaseUtils.executeQuery(
                    'SELECT * FROM NOZZLE WHERE PID=? AND TYPE=?',
                    [pid, ntype]
                );
            } else {
                nozzleDetails = await databaseUtils.executeQuery(
                    'SELECT * FROM NOZZLE WHERE PID=?',
                    [pid]
                );
            }
            nozzleDetails = nozzleDetails || [];

            const nozzleType = await databaseUtils.executeQuery(
                'SELECT DISTINCT(TYPE) FROM NOZZLE WHERE PID=?',
                [pid]
            ) || [];

            const tankTypes = await databaseUtils.executeQuery(
                'SELECT TYPE FROM TANK_METADATA WHERE PID=?',
                [pid]
            ) || [];

            await ctx.render('inozzle', {
                nozzleDetails: nozzleDetails,
                nozzleType: nozzleType,
                ntype: ntype,
                tankTypes: tankTypes
            });
        } catch (error) {
            console.error('Error in showiNozzlePage:', error);
            await ctx.render('inozzle', {
                nozzleDetails: [],
                nozzleType: [],
                ntype: ctx.request.query.ntype,
                tankTypes: []
            });
        }
    },

    showiNozzle2Page: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const body = ctx.request.body || {};
            const act = (body.act || '').split(' ');

            if (parseInt(act[0]) === 1) {
                // ADD
                const nno = body.nno;
                const ntype = body.ntype;

                if (nno && ntype) {
                    await databaseUtils.executeQuery(
                        'INSERT INTO NOZZLE (PID, NOZZLE_NUMBER, TYPE, ACTIVE) VALUES (?, ?, ?, 1)',
                        [pid, nno, ntype]
                    );
                }
            } else if (parseInt(act[0]) === 2) {
                // EDIT
                const uid = act[1];
                const ntype = body.ntype;

                if (ntype) {
                    await databaseUtils.executeQuery(
                        'UPDATE NOZZLE SET TYPE=? WHERE ID=? AND PID=?',
                        [ntype, uid, pid]
                    );
                }
            } else {
                // TOGGLE ACTIVE
                const uid = act[2];
                const active = parseInt(act[1]);
                await databaseUtils.executeQuery(
                    'UPDATE NOZZLE SET ACTIVE=? WHERE ID=? AND PID=?',
                    [active, uid, pid]
                );
            }

            ctx.redirect('/app/inozzle');
        } catch (error) {
            console.error('Error in showiNozzle2Page:', error);
            ctx.redirect('/app/inozzle');
        }
    },

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
    }
};
