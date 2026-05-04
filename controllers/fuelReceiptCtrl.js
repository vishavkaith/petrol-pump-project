var sessionUtils = require('../utils/sessionUtils');
var util=require('util');
const databaseUtils = require('../utils/databaseUtils');

module.exports = {

  // =========================
  // SHOW FUEL RECEIPT PAGE
  // =========================
  showfuelReceipt: async (ctx) => {
    let pid;
    try {
      pid = ctx.currentUser[0].PID;
    } catch (e) {
      pid = 0;
    }

    const query = `
      SELECT 
        f.TT,
        f.INVOICE_NO,
        f.INVOICE_DATE,
        f.INVOICE_AMOUNT,
        f.INVOICE_QTY,
        f.INVOICE_TEMP,
        f.RO_TEMP,
        f.INVOICE_DENSITY,
        f.RO_COMPOSITE_DENSITY,
        f.TVA,
        f.SHORT_REPORT,
        f.FREIGHT_INVOICE_NO,
        f.FREIGHT_INVOICE_AMOUNT,
        t.NAME AS TRANSPORT_NAME
      FROM FUEL_RECEIPT f
      LEFT JOIN TRANSPORT t ON f.TID = t.ID
      WHERE f.PID = ?
      ORDER BY f.INVOICE_DATE DESC
    `;

    const fuelDetails = await databaseUtils.executeQuery(query, [pid]);

    await ctx.render('fuelReceipt', {
      fuelDetails
    });
  }

};
