const databaseUtils = require('../utils/databaseUtils');

module.exports = {

    // =========================
    // SHOW TRANSPORT PAGE
    // =========================
    showTransport: async (ctx) => {
        try {
            let pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) {}

            if (!pid) {
                await ctx.render('transport', {
                    transportDetails: []
                });
                return;
            }

            const transportDetails = await databaseUtils.executeQuery(
                `SELECT *
                 FROM TRANSPORT
                 WHERE PID = ?
                 ORDER BY CREATED_AT DESC`,
                [pid]
            ) || [];

            await ctx.render('transport', {
                transportDetails
            });

        } catch (err) {
            console.error('Error in showTransport:', err);
            await ctx.render('transport', {
                transportDetails: []
            });
        }
    },

    // =========================
    // ADD / EDIT TRANSPORT
    // =========================
    showTransport2: async (ctx) => {
        try {
            let pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) {}

            if (!pid) {
                ctx.redirect('/app/transport');
                return;
            }

            const body = ctx.request.body || {};

            // ADD
            if (body.tp === '1') {
                await databaseUtils.executeQuery(
                    `INSERT INTO TRANSPORT
                     (PID, NAME, VEHICLE_NUMBER, DRIVER_NAME, PHONE)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        pid,
                        body.name,
                        body.vehicle_number || null,
                        body.driver_name || null,
                        body.phone || null
                    ]
                );
            }

            // EDIT
            if (body.tp === '2') {
                await databaseUtils.executeQuery(
                    `UPDATE TRANSPORT
                     SET NAME = ?, VEHICLE_NUMBER = ?, DRIVER_NAME = ?, PHONE = ?
                     WHERE ID = ? AND PID = ?`,
                    [
                        body.name,
                        body.vehicle_number || null,
                        body.driver_name || null,
                        body.phone || null,
                        body.id,
                        pid
                    ]
                );
            }

            ctx.redirect('/app/transport');

        } catch (err) {
            console.error('Error in showTransport2:', err);
            ctx.redirect('/app/transport');
        }
    }
};
