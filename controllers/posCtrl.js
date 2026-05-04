const databaseUtils = require('../utils/databaseUtils');
const util = require('util');
//const databaseUtils = require('../utils/databaseUtils');

module.exports = {

    // =========================
    // SHOW POS PAGE
    // =========================
    showPOSPage: async (ctx) => {

       // let pid = 0;


        let userId = 0;
  var msg;
        var pid;
try{ pid=ctx.currentUser[0].PID;}
catch(e){pid=0;
    msg='Login FIrst';

}
if(msg) await ctx.render('login',{
    msg:msg,
});
        try {
            pid = ctx.currentUser[0].PID;
            userId = ctx.currentUser[0].ID;
        } catch (e) {}

        // Get active shift
        const shiftQuery = `
            SELECT * FROM SHIFT
            WHERE PID = ?
            AND END_TIME IS NULL
            LIMIT 1
        `;

        const shiftResult = await databaseUtils.executeQuery(shiftQuery, [pid]);
        const shift = shiftResult && shiftResult.length ? shiftResult[0] : null;

       /* if (!shift) {
            ctx.body = "No active shift found.";
            return;
        }*/
if (!shift) {
    await ctx.render('pos-index', {
        shift: null,
        products: [],
        userId,
        error: "Please open a shift before using POS."
    });
    return;
}
        // Get products (non-fuel only recommended)
        const products = await databaseUtils.executeQuery(
            `SELECT * FROM PRODUCT WHERE PID = ? AND ACTIVE = 1`,
            [pid]
        ) || [];

        await ctx.render('pos-index', {
            shift,
            products,
            userId
        });
    },

    // =========================
    // CREATE BILL
    // =========================
   createBill: async (ctx) => {

    const body = ctx.request.body;

    let pid = 0;
    let userId = 0;
console.log("Current User JSON:");
console.log(JSON.stringify(ctx.currentUser, null, 2));
    try {
        pid = ctx.currentUser[0].PID;
        userId = ctx.currentUser[0].ID;
    } catch (e) {}

    const shiftId = body.shift_id;
    const items = JSON.parse(body.items || "[]");
    const subtotal = parseFloat(body.subtotal || 0);
    const discount = parseFloat(body.discount || 0);
    const total = parseFloat(body.total || 0);

    if (!shiftId || items.length === 0) {
        ctx.body = { success: false, message: "Invalid bill data" };
        return;
    }

    const billNo = 'BILL-' + + Date.now();

    // 1️⃣ Insert Bill
    const billResult = await databaseUtils.executeQuery(`
        INSERT INTO POS_BILL
        (PID, SHIFT_ID, BILL_NO, CASHIER_ID, SUBTOTAL, DISCOUNT, TOTAL)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [pid, shiftId, billNo, userId, subtotal, discount, total]);

    const billId = billResult.lastInsertRowid;

    for (let item of items) {

        // 2️⃣ Get product details
        const productResult = await databaseUtils.executeQuery(`
            SELECT TYPE, PRICE
            FROM PRODUCT
            WHERE ID = ?
        `, [item.product_id]);

        if (!productResult || productResult.length === 0) continue;

        const product = productResult[0];

        // 3️⃣ Insert Bill Item
        await databaseUtils.executeQuery(`
            INSERT INTO POS_BILL_ITEMS
            (BILL_ID, PRODUCT_ID, QTY, PRICE, TOTAL)
            VALUES (?, ?, ?, ?, ?)
        `, [
            billId,
            item.product_id,
            item.qty,
            item.price,
            item.total
        ]);

        // 4️⃣ Get current average rate from ledger
        const avgResult = await databaseUtils.executeQuery(`
            SELECT 
                SUM(QTY) as total_qty,
                SUM(AMOUNT) as total_amount
            FROM INVENTORY_LEDGER
            WHERE PID = ?
            AND PRODUCT_TYPE = ?
        `, [pid, product.PRODUCT_TYPE]);

        let avgRate = 0;

        if (avgResult && avgResult.length) {
            const totalQty = avgResult[0].total_qty || 0;
            const totalAmount = avgResult[0].total_amount || 0;

            if (totalQty !== 0) {
                avgRate = totalAmount / totalQty;
            }
        }

        const saleAmountAtCost = avgRate * item.qty;

        // 5️⃣ Insert Ledger Entry (POS_SALE)
        await databaseUtils.executeQuery(`
            INSERT INTO INVENTORY_LEDGER
            (PID, PRODUCT_TYPE, TRANSACTION_DATE, SOURCE_TYPE, SOURCE_ID, QTY, RATE, AMOUNT, CREATED_BY)
            VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?, ?)
        `, [
            pid,
            product.PRODUCT_TYPE,
            'POS_SALE',
            billId,
            -Math.abs(item.qty),    // stock reduce
            avgRate,
            -Math.abs(saleAmountAtCost),
            userId
        ]);
    }

    ctx.body = {
        success: true,
        bill_no: billNo
    };
}
,

  // =========================
// GET SHIFT BILLS
// =========================
getShiftBills: async (ctx) => {

    const shiftId = ctx.params.shiftId;

    const bills = await databaseUtils.executeQuery(`
        SELECT B.*, 
               U.FNAME || ' ' || U.LNAME AS CASHIER_NAME
        FROM POS_BILL B
        LEFT JOIN USER U ON U.ID = B.CASHIER_ID
        WHERE B.SHIFT_ID = ?
        ORDER BY B.ID DESC
    `, [shiftId]) || [];

    await ctx.render('pos-bill-list', { bills });
},

// =========================
// GET ALL BILLS
// =========================
getAllBills: async (ctx) => {

    const bills = await databaseUtils.executeQuery(`
        SELECT B.*, 
               U.FNAME || ' ' || U.LNAME AS CASHIER_NAME
        FROM POS_BILL B
        LEFT JOIN USER U ON U.ID = B.CASHIER_ID
        ORDER BY B.ID DESC
    `) || [];

    await ctx.render('pos-bill-list', { bills });
},

// =========================
// VIEW BILL
// =========================
viewBill: async (ctx) => {

    const billId = ctx.params.billId;

    const bill = await databaseUtils.executeQuery(`
        SELECT B.*, 
               U.FNAME || ' ' || U.LNAME AS CASHIER_NAME
        FROM POS_BILL B
        LEFT JOIN USER U ON U.ID = B.CASHIER_ID
        WHERE B.ID = ?
    `, [billId]);

    if (!bill || bill.length === 0) {
        ctx.body = "Bill not found";
        return;
    }

    const items = await databaseUtils.executeQuery(`
        SELECT I.*, P.NAME AS PRODUCT_NAME
        FROM POS_BILL_ITEMS I
        LEFT JOIN PRODUCT P ON P.ID = I.PRODUCT_ID
        WHERE I.BILL_ID = ?
    `, [billId]) || [];

    await ctx.render('pos-bill-view', {
        bill: bill[0],
        items,
        printMode: false
    });
},

// =========================
// PRINT BILL
// =========================
printBill: async (ctx) => {

    const billId = ctx.params.billId;

    const bill = await databaseUtils.executeQuery(`
        SELECT B.*, 
               U.FNAME || ' ' || U.LNAME AS CASHIER_NAME
        FROM POS_BILL B
        LEFT JOIN USER U ON U.ID = B.CASHIER_ID
        WHERE B.ID = ?
    `, [billId]);

    if (!bill || bill.length === 0) {
        ctx.body = "Bill not found";
        return;
    }

    const items = await databaseUtils.executeQuery(`
        SELECT I.*, P.NAME AS PRODUCT_NAME
        FROM POS_BILL_ITEMS I
        LEFT JOIN PRODUCT P ON P.ID = I.PRODUCT_ID
        WHERE I.BILL_ID = ?
    `, [billId]) || [];

    await ctx.render('pos-bill-view', {
        bill: bill[0],
        items,
        printMode: true
    });
}
}
