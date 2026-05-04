const databaseUtils = require('../utils/databaseUtils');

module.exports = {
    showicollectionPage: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const collectiontype = await databaseUtils.executeQuery(
                'SELECT ID, MODE FROM COLLECTION_MODE WHERE PID=?',
                [pid]
            ) || [];

            await ctx.render('icollectionmode', {
                collectiontype: collectiontype
            });
        } catch (error) {
            console.error('Error in showicollectionPage:', error);
            await ctx.render('icollectionmode', {
                collectiontype: []
            });
        }
    },

    showicollection2Page: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const body = ctx.request.body || {};
            const mode = body.mode;

            if (mode) {
                const collectionresult = await databaseUtils.executeQuery(
                    'INSERT INTO COLLECTION_MODE(PID, MODE) VALUES (?, ?)',
                    [pid, mode]
                );
                const modee = collectionresult.lastInsertRowid;

                await databaseUtils.executeQuery(
                    'INSERT INTO BALANCE (CRDB, BAL, PID, MODE, SID) VALUES (?, ?, ?, ?, ?)',
                    [0, 0, pid, modee, 0]
                );
            }

            ctx.redirect('/app/icollectionmode');
        } catch (error) {
            console.error('Error in showicollection2Page:', error);
            ctx.redirect('/app/icollectionmode');
        }
    },
    // ==========================
// UPDATE COLLECTION MODE (Modal)
// ==========================
updateCollection: async (ctx) => {
    try {
        var pid;
        try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

        const body = ctx.request.body || {};
        const id = body.id;
        const mode = body.mode;

        if (!id || !mode || mode.trim() === '') {
            return ctx.redirect('/app/icollectionmode');
        }

        await databaseUtils.executeQuery(
            'UPDATE COLLECTION_MODE SET MODE=? WHERE ID=? AND PID=?',
            [mode.trim(), id, pid]
        );

        ctx.redirect('/app/icollectionmode');

    } catch (error) {
        console.error('Error updating collection mode:', error);
        ctx.redirect('/app/icollectionmode');
    }
}
};

