#!/usr/bin/env node

const databaseUtils = require('../utils/databaseUtils');

async function checkTable() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('SHIFT_NOZZLE_DSM')");
    console.log('SHIFT_NOZZLE_DSM schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));

    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='SHIFT_NOZZLE_DSM'");
    console.log('SHIFT_NOZZLE_DSM CREATE SQL:', JSON.stringify(createSqlRows, null, 2));

    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM SHIFT_NOZZLE_DSM LIMIT 50');
    console.log('SHIFT_NOZZLE_DSM Data (up to 50 rows):', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error querying SHIFT_NOZZLE_DSM:', err);
    process.exitCode = 1;
  }
}

checkTable();
async function checkTableshift() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('SHIFT')");
    console.log('SHIFT schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));

    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='SHIFT'");
    console.log('SHIFT CREATE SQL:', JSON.stringify(createSqlRows, null, 2));

    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM SHIFT LIMIT 50');
    console.log('SHIFT Data (up to 50 rows):', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error querying SHIFT:', err);
    process.exitCode = 1;
  }
}

checkTableshift();

//checkTableshift1();
async function checkTableshift1() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('SHIFT_METADATA')");
    console.log('SHIFT_METADATA schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));

    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='SHIFT_METADATA'");
    console.log('SHIFT_METADATA CREATE SQL:', JSON.stringify(createSqlRows, null, 2));

    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM SHIFT_METADATA LIMIT 50');
    console.log('SHIFT_METADATA Data (up to 50 rows):', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error querying SHIFT:', err);
    process.exitCode = 1;
  }
}

checkTableshift1();
//SELECT * FROM SHIFT_NOZZLE WHERE SHIFT_ID = 5;


async function checkTableSHIFT_NOZZLE_DSM() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('SHIFT_NOZZLE_DSM')");
    console.log('SHIFT_NOZZLE_DSM schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));

    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='SHIFT_NOZZLE_DSM'");
    console.log('SHIFT_NOZZLE_DSM CREATE SQL:', JSON.stringify(createSqlRows, null, 2));

    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM SHIFT_NOZZLE_DSM LIMIT 50');
    console.log('SHIFT_NOZZLE_DSM Data (up to 50 rows):', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error querying SHIFT_NOZZLE_DSM:', err);
    process.exitCode = 1;
  }
}

checkTableSHIFT_NOZZLE_DSM();

async function checkTableDATSHEET() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('DATASHEET')");
    console.log('DATASHEET schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));                
    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='DATASHEET'");
    console.log('DATASHEET CREATE SQL:', JSON.stringify(createSqlRows, null, 2));

    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM DATASHEET LIMIT 50');
    console.log('DATASHEET Data (up to 50 rows):', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error querying DATASHEET:', err);
    process.exitCode = 1;
  }
}

checkTableDATSHEET();
async function checkTablefuelreceipt() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('FUEL_RECEIPT')");
    console.log('FUEL_RECEIPT schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));                
    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='FUEL_RECEIPT'");
    console.log('FUEL_RECEIPT CREATE SQL:', JSON.stringify(createSqlRows, null, 2));

    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM FUEL_RECEIPT LIMIT 50');
    console.log('FUEL_RECEIPT Data (up to 50 rows):', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error querying FUEL_RECEIPT:', err);
    process.exitCode = 1;
  }
}

checkTablefuelreceipt();
async function checkTablenozzle() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('NOZZLE')");
    console.log('NOZZLE schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));                
    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='NOZZLE'");
    console.log('NOZZLE CREATE SQL:', JSON.stringify(createSqlRows, null, 2)); 
    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM NOZZLE LIMIT 50');
    console.log('NOZZLE Data (up to 50 rows):', JSON.stringify(result, null, 2));

 }catch (err) {
    console.error('Error querying NOZZLE:', err);
    process.exitCode = 1;
  }
}
checkTablenozzle();

async function checkTablePOS_BILL_ITEMS() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('POS_BILL_ITEMS')");
    console.log('POS_BILL_ITEMS schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));                
    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='POS_BILL_ITEMS'");
    console.log('POS_BILL_ITEMS  CREATE SQL:', JSON.stringify(createSqlRows, null, 2)); 
    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM POS_BILL_ITEMS LIMIT 50');
    console.log('POS_BILL_ITEMS Data (up to 50 rows):', JSON.stringify(result, null, 2));

 }catch (err) {
    console.error('Error querying POS_BILL_ITEMS:', err);
    process.exitCode = 1;
  }
}
checkTablePOS_BILL_ITEMS();
async function checkTablePOS_BILL() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('POS_BILL')");
    console.log('POS_BILL schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));                
    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='POS_BILL'");
    console.log('POS_BILL  CREATE SQL:', JSON.stringify(createSqlRows, null, 2)); 
    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM POS_BILL LIMIT 50');
    console.log('POS_BILL Data (up to 50 rows):', JSON.stringify(result, null, 2));

 }catch (err) {
    console.error('Error querying POS_BILL:', err);
    process.exitCode = 1;
  }
}
checkTablePOS_BILL();
async function checkTableTransport() {
  try {
    // Print table schema using PRAGMA
    const schemaInfo = await databaseUtils.executeQuery("PRAGMA table_info('TRANSPORT')");
    console.log('TRANSPORT schema (PRAGMA table_info):', JSON.stringify(schemaInfo, null, 2));                
    // Print CREATE statement from sqlite_master
    const createSqlRows = await databaseUtils.executeQuery("SELECT sql FROM sqlite_master WHERE type='table' AND name='TRANSPORT'");
    console.log('TRANSPORT  CREATE SQL:', JSON.stringify(createSqlRows, null, 2)); 
    // Print up to 50 rows from the table
    const result = await databaseUtils.executeQuery('SELECT * FROM TRANSPORT LIMIT 50');
    console.log('TRANSPORT Data (up to 50 rows):', JSON.stringify(result, null, 2));

 }catch (err) {
    console.error('Error querying TRANSPORT:', err);
    process.exitCode = 1;
  }
}
checkTableTransport();