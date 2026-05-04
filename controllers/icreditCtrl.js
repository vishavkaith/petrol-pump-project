const databaseUtils = require('../utils/databaseUtils');

module.exports = {
    showiCreditPage: async (ctx) => {
        try {
            let pid = null;
            try { pid = ctx.currentUser[0].PID; } catch (e) {}

            // WHY: Do not query with PID=0, return empty data instead
            if (!pid) {
                await ctx.render('icredit', {
                    creditDetail: []
                });
                return;
            }

            const creditDetail = await databaseUtils.executeQuery(
                'SELECT ID,NAME,ADDRESS,PHONE,BALANCE FROM CREDIT WHERE PID=?',
                [pid]
            ) || [];

            await ctx.render('icredit', {
                creditDetail: creditDetail
            });
        } catch (error) {
            console.error('Error in showiCreditPage:', error);
            await ctx.render('icredit', {
                creditDetail: []
            });
        }
    },

    showiCredit2Page: async (ctx) => {
        try {
            let pid = null;
            try { pid = ctx.currentUser[0].PID; } catch (e) {}

            // WHY: Do not query with PID=0, redirect instead
            if (!pid) {
                ctx.redirect('/app/icredit');
                return;
            }

            const body = ctx.request.body || {};
            const act = (body.cid || '').split(' ');

            if (parseInt(act[0]) === 2) {
                // EDIT
                const name = body.name;
                const address = body.address;
                const phone = body.phone;
                const balance = body.balance;

                if (name && address && phone !== undefined && balance !== undefined) {
                    await databaseUtils.executeQuery(
                        'UPDATE CREDIT SET NAME=?, ADDRESS=?, PHONE=?, BALANCE=? WHERE ID=? AND PID=?',
                        [name, address, phone, balance, parseInt(act[1]), pid]
                    );
                }
            } else if (parseInt(act[0]) === 1) {
                // ADD
                const name = body.name;
                const address = body.address;
                const phone = body.phone;
                const balance = body.balance;

                if (name && address && phone !== undefined && balance !== undefined) {
                    await databaseUtils.executeQuery(
                        'INSERT INTO CREDIT (PID, NAME, ADDRESS, PHONE, BALANCE) VALUES (?, ?, ?, ?, ?)',
                        [pid, name, address, phone, balance]
                    );
                }
            } else {
                // DELETE/UNDO
                const active = parseInt(act[1]);
                await databaseUtils.executeQuery(
                    'UPDATE CREDIT SET ACTIVE=? WHERE ID=? AND PID=?',
                    [active, parseInt(act[2]), pid]
                );
            }

            ctx.redirect('/app/icredit');
        } catch (error) {
            console.error('Error in showiCredit2Page:', error);
            ctx.redirect('/app/icredit');
        }
    }
};