const sessionUtils = require('../utils/sessionUtils');
const util = require('util');
const databaseUtils = require('../utils/databaseUtils');

module.exports = {

    // =========================
    // SHOW ADJUSTMENT PAGE
    // =========================
    showAdjustmentPage: async (ctx) => {
        const pid = ctx.currentUser[0].PID;

    const adjustments = await databaseUtils.executeQuery(`
        SELECT ID, PRODUCT_TYPE, QTY, RATE, AMOUNT, TRANSACTION_DATE
        FROM INVENTORY_LEDGER
        WHERE PID = ?
        AND SOURCE_TYPE = 'ADJUSTMENT'
        ORDER BY TRANSACTION_DATE DESC
    `, [pid]);

    await ctx.render('inventory-adjustment', {
        currentUser: ctx.currentUser,
        adjustments
    });
    },
// =========================
// UPDATE ADJUSTMENT
// =========================
updateAdjustment: async (ctx) => {

    const { id, product_type, txn_type, qty, rate, txn_date } = ctx.request.body;

    let finalQty = parseFloat(qty);
    if (txn_type === 'SALE') {
        finalQty = -finalQty;
    }

    const amount = finalQty * parseFloat(rate);

    await databaseUtils.executeQuery(`
        UPDATE INVENTORY_LEDGER
        SET PRODUCT_TYPE = ?,
            QTY = ?,
            RATE = ?,
            AMOUNT = ?,
            TRANSACTION_DATE = ?
        WHERE ID = ?
    `, [
        product_type,
        finalQty,
        rate,
        amount,
        txn_date,
        id
    ]);

    ctx.redirect('/app/inventory-adjustment');
},
// =========================
// DELETE ADJUSTMENT
// =========================
deleteAdjustment: async (ctx) => {

    const { id } = ctx.request.body;
    const pid = ctx.currentUser[0].PID;

    // Safety: delete only if belongs to same company
    await databaseUtils.executeQuery(`
        DELETE FROM INVENTORY_LEDGER
        WHERE ID = ?
        AND PID = ?
        AND SOURCE_TYPE = 'ADJUSTMENT'
    `, [id, pid]);

    ctx.redirect('/app/inventory-adjustment');
},
    // =========================
    // SAVE ADJUSTMENT
    // =========================
    saveAdjustment: async (ctx) => {

        const body = ctx.request.body;

        const pid = ctx.currentUser[0].PID;
        const userId = ctx.currentUser[0].ID;

        const {
            product_type,
            txn_type,
            qty,
            rate,
            txn_date,
            reason
        } = body;

        let finalQty = parseFloat(qty);
        if (txn_type === 'SALE') {
            finalQty = -finalQty;
        }

        const amount = finalQty * parseFloat(rate);

        await databaseUtils.executeQuery(`
            INSERT INTO INVENTORY_LEDGER
            (PID, SOURCE_TYPE, SOURCE_ID, PRODUCT_TYPE, QTY, RATE, AMOUNT, TRANSACTION_DATE)
            VALUES (?, 'ADJUSTMENT', 0, ?, ?, ?, ?, ?)
        `, [
            pid,
            product_type,
            finalQty,
            rate,
            amount,
            txn_date
        ]);
/* 
        await databaseUtils.executeQuery(`
            INSERT INTO AUDIT_LOGS (user_id, action, description)
            VALUES (?, 'INVENTORY_ADJUSTMENT', ?)
        `, [
            userId,
            `Backdated ${txn_type} | ${product_type} | Qty:${qty} | Rate:${rate} | Date:${txn_date}`
        ]); */

     //   ctx.flash('success', 'Inventory adjustment saved successfully');

        // IMPORTANT: redirect uses URL, not view name
        ctx.redirect('/app/inventory-adjustment');
    }
};
