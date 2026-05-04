const databaseUtils = require('../utils/databaseUtils');

module.exports = {

    // =========================
    // SHOW PRODUCT PAGE
    // =========================
    showiProductPage: async (ctx) => {
        try {
            let pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const ptype = ctx.request.query.ptype;
            const pname = ctx.request.query.pname;

            let query = `
                SELECT P.*, 
                       COALESCE((
                           SELECT SUM(L.QTY)
                           FROM INVENTORY_LEDGER L
                           WHERE L.PID = P.PID
                           AND L.PRODUCT_TYPE = P.NAME
                       ),0) AS STOCK
                FROM PRODUCT P
                WHERE P.PID = ?
            `;

            const params = [pid];

            if (pname && pname !== 'All') {
                query += ` AND P.NAME = ?`;
                params.push(pname);
            }

            if (ptype && ptype !== 'All') {
                query += ` AND P.TYPE = ?`;
                params.push(parseInt(ptype));
            }

            const productDetails = await databaseUtils.executeQuery(query, params) || [];

            const productname = await databaseUtils.executeQuery(
                'SELECT NAME FROM PRODUCT WHERE PID=?',
                [pid]
            ) || [];

            await ctx.render('iproduct', {
                productDetails,
                productname,
                pname,
                ptype
            });

        } catch (error) {
            console.error('Error in showiProductPage:', error);
            ctx.redirect('/app/iproduct');
        }
    },

    // =========================
    // ADD / EDIT / TOGGLE
    // =========================
    showiProduct2Page: async (ctx) => {
        try {
            let pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            const body = ctx.request.body || {};
            const name = body.name;
            const type = body.type;
            const price = body.price;
            const act = body.act;

            const actArr = (act || '').split(' ');

            /* --------------------------
               ADD PRODUCT
            -------------------------- */
            if (actArr[1] === "4") {
                if (name && type && price) {
                   await databaseUtils.executeQuery(
    `INSERT INTO PRODUCT 
     (PID, NAME, TYPE, PRICE, MANAGE_STOCK, ACTIVE)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [pid, name, type, price, body.manage_stock || 1]
);

                }
            }

            /* --------------------------
               EDIT PRODUCT
            -------------------------- */
            else if (actArr[0] === "2") {
                const editId = parseInt(actArr[1]);

                if (name && type && price && editId) {
                    await databaseUtils.executeQuery(
                        `UPDATE PRODUCT
                         SET NAME=?, TYPE=?, PRICE=?
                         WHERE ID=?`,
                        [name, type, price, editId]
                    );
                }
            }

            /* --------------------------
               TOGGLE ACTIVE
            -------------------------- */
            else if (actArr[0] === "3") {
                const active = parseInt(actArr[1]);
                const toggleId = parseInt(actArr[2]);

                if (toggleId) {
                    await databaseUtils.executeQuery(
                        `UPDATE PRODUCT SET ACTIVE=? WHERE ID=?`,
                        [active, toggleId]
                    );
                }
            }

            ctx.redirect('/app/iproduct');

        } catch (error) {
            console.error('Error in showiProduct2Page:', error);
            ctx.redirect('/app/iproduct');
        }
    },

    // =========================
    // TANK PAGE (UNCHANGED)
    // =========================
    showiTankPage: async (ctx) => {
        try {
            let pid;
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

            const tankType = await databaseUtils.executeQuery(
                'SELECT DISTINCT(TYPE) FROM TANK_METADATA WHERE PID=?',
                [pid]
            ) || [];

            await ctx.render('itank', {
                DetailtankResult: DetailtankResult || [],
                tankType,
                ttype
            });

        } catch (error) {
            console.error('Error in showiTankPage:', error);
            ctx.redirect('/app/itank');
        }
    }
};
