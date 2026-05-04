const Router = require('koa-router');
const { koaBody } = require('koa-body');

const router = new Router();

router.get('/test', (ctx) => { console.log('test route called'); ctx.body = 'test route works'; });

 // Welcome Routes

const welcomeCtrl = require('./../controllers/WelcomeCtrl');
const shiftCtrl = require('./../controllers/shiftCtrl');
const reportCtrl = require('./../controllers/reportCtrl');
//const detailCtrl = require('./../controllers/detailCtrl');
const financeCtrl = require('./../controllers/financeCtrl');
const employeeCtrl = require('./../controllers/employeeCtrl');
const userCtrl = require('./../controllers/userCtrl');
const tankCtrl = require('./../controllers/tankCtrl');
const productCtrl = require('./../controllers/productCtrl');
const nozzleCtrl = require('./../controllers/nozzleCtrl');
const collectionCtrl = require('./../controllers/collectionCtrl');
const fuelReceiptCtrl = require('./../controllers/fuelReceiptCtrl');
const transportCtrl = require('./../controllers/transportCtrl');
const creditCtrl = require('./../controllers/icreditCtrl');
const backupCtrl = require('./../controllers/backupCtrl');
const reminderCtrl = require('./../controllers/reminderCtrl');
const inventoryCtrl = require('./../controllers/inventoryCtrl');
const posCtrl = require('../controllers/posCtrl');

router.get('/icredit', creditCtrl.showiCreditPage);
router.post('/icredit', creditCtrl.showiCredit2Page);

router.get('/transport', transportCtrl.showTransport);
router.post('/transport', transportCtrl.showTransport2);

router.get('/fuelReceipt', fuelReceiptCtrl.showfuelReceipt);
//router.post('/fuelReceipt/add', fuelReceiptCtrl.addFuelReceipt);

router.get('/dashboard/:pid', welcomeCtrl.showDashboardPage);

router.get('/newPetrolPump', welcomeCtrl.showNewPetrolPumpPage);

router.post('/newPetrolPump', welcomeCtrl.addNewPetrolPump);

router.get('/shift/:pid', shiftCtrl.showShiftpage);
router.get('/report', reportCtrl.showReportpage);
//router.get('/tank/:pid', detailCtrl.showtankPage);
//router.get('/employee', employeeCtrl.showEmployeePage);
//router.get('/product/:pid', detailCtrl.showProductPage);
router.get('/empent', welcomeCtrl.showEmpEnteries1Page);
router.get('/msg', welcomeCtrl.showEmpEnteriesPage);

router.get('/finance/:pid', financeCtrl.showfinancePage);
router.get('/itank', tankCtrl.showiTankPage);
router.post('/itank', tankCtrl.showiTank3Page);
router.get('/iproduct', productCtrl.showiProductPage);
     router.post('/iproduct',productCtrl.showiProduct2Page);
router.get('/login', welcomeCtrl.showLoginPage);
router.post('/getpage', userCtrl.login);
router.get('/logout', userCtrl.logout);
//router.get('/employee1', employeeCtrl.showEmployee1Page);
router.get('/ishift', shiftCtrl.showiShiftPage);

router.post('/ishift', shiftCtrl.showiShift2Page);
router.get('/iemployee', employeeCtrl.showiemployeePage);
router.get('/ifinance', financeCtrl.showifinancePage);
router.post('/iemployee', employeeCtrl.showiEmployee2Page);
router.get('/ischedule', shiftCtrl.showiSchedulePage);
router.post('/ischedule', shiftCtrl.showiSchedule2Page);

router.get('/idash', welcomeCtrl.showidash);
router.get('/header', welcomeCtrl.showHeader);

router.get('/inozzle', nozzleCtrl.showiNozzlePage);
router.post('/inozzle', nozzleCtrl.showiNozzle2Page);

router.get('/icollectionmode', collectionCtrl.showicollectionPage);
router.post('/icollectionmode/update', collectionCtrl.updateCollection);
router.post('/icollectionmode', collectionCtrl.showicollection2Page);

router.get('/backup', backupCtrl.showBackupPage);
router.get('/backup/export', backupCtrl.exportDatabase);
router.post('/backup/import', backupCtrl.importDatabase);

router.get('/reminder', reminderCtrl.showReminderPage);
router.post('/reminder/add', reminderCtrl.addReminder);
router.post('/reminder/toggle', reminderCtrl.toggleReminder);
router.post('/reminder/delete', reminderCtrl.deleteReminder);
router.get('/reminder/active', reminderCtrl.getActiveReminders);

router.get('/profile', userCtrl.showProfile);
router.post('/profile', userCtrl.updateProfile);
router.get('/inventory-adjustment', inventoryCtrl.showAdjustmentPage);
router.post('/inventory-adjustment/update', inventoryCtrl.updateAdjustment);
router.post('/inventory-adjustment/delete', inventoryCtrl.deleteAdjustment);
router.post('/inventory-adjustment', inventoryCtrl.saveAdjustment);

router.get('/pos-index', posCtrl.showPOSPage);
router.post('/pos-create', posCtrl.createBill);
router.get('/pos-bill-list', posCtrl.getShiftBills);
router.get('/pos-all-bills', posCtrl.getAllBills);
router.get('/pos/view/:billId', posCtrl.viewBill);
router.get('/pos/print/:billId', posCtrl.printBill);
//module.exports = router.routes();
module.exports = router;