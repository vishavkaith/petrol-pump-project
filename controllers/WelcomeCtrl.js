var sessionUtils = require('../utils/sessionUtils');

var util=require('util');
var databaseUtils=require('./../utils/databaseUtils');
const log = require('electron-log');   // ✅ ADD THIS

module.exports = {
    showDashboardPage: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; }
            catch (e) { pid = 0; }

            var petrolpumpQueryString = 'select * from petrolpump where id=?';
            var petrolpumpResult = await databaseUtils.executeQuery(petrolpumpQueryString, [pid]);
            petrolpumpResult = petrolpumpResult || [];

            //For total sale of HSD and MS
            var saleQueryString = `SELECT N.TYPE, SUM(SND.DOR - SND.DCR - SND.PUMP_TEST - SND.SELF) AS SALE 
                                   FROM SHIFT S 
                                   JOIN SHIFT_NOZZLE_DSM SND ON SND.SHIFT_ID = S.ID 
                                   JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                                   WHERE DATE(S.START_TIME) = CURRENT_DATE AND S.PID = ? 
                                   GROUP BY N.TYPE`;
            var saleResult = await databaseUtils.executeQuery(saleQueryString, [pid]);
            saleResult = saleResult || [];

            //For toal quantity left of HSD and MS
            var quantityQueryString = `SELECT N.TYPE, SUM(SND.DCR) AS QTY_LEFT 
                                       FROM SHIFT S 
                                       JOIN SHIFT_NOZZLE_DSM SND ON SND.SHIFT_ID = S.ID 
                                       JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                                       WHERE DATE(S.START_TIME) = CURRENT_DATE AND S.PID = ? 
                                       GROUP BY N.TYPE`;
            var quantityResult = await databaseUtils.executeQuery(quantityQueryString, [pid]);
            quantityResult = quantityResult || [];

            //For total onhand cash - table doesn't exist, return empty
            var cashQueryString = 'SELECT 0 AS TOTAL';
            var cashResult = [{TOTAL: 0}];

            //For total bank balance - table doesn't exist, return empty
            var bankQueryString = 'SELECT 0 AS TOTAL';
            var bankResult = [{TOTAL: 0}];

            //For total fleet balance - table doesn't exist, return empty
            var fleetQueryString = 'SELECT 0 AS TOTAL';
            var fleetResult = [{TOTAL: 0}];

            var shiftQueryString = `SELECT S.START_TIME, S.END_TIME, U1.FNAME AS SUPERVISOR 
                                   FROM SHIFT S 
                                   JOIN USER U1 ON S.SUPERVISOR_ID = U1.ID 
                                   WHERE S.PID = ? 
                                   ORDER BY S.ID DESC LIMIT 1`;
            var shiftResult = await databaseUtils.executeQuery(shiftQueryString, [pid]);
            shiftResult = shiftResult || [];

            var nozzleCountQueryString = 'SELECT COUNT(*) as C FROM NOZZLE WHERE PID=?';
            var nozzleCountResult = await databaseUtils.executeQuery(nozzleCountQueryString, [pid]);
            nozzleCountResult = nozzleCountResult || [];

            var shiftDetailsQueryString = `SELECT U2.FNAME AS DSM, N.NOZZLE_NUMBER, SND.DOR 
                                           FROM SHIFT S 
                                           JOIN SHIFT_NOZZLE_DSM SND ON SND.SHIFT_ID = S.ID 
                                           JOIN NOZZLE N ON SND.NOZZLE_ID = N.ID 
                                           JOIN USER U2 ON SND.USER_ID = U2.ID 
                                           WHERE S.PID = ? 
                                           ORDER BY S.ID DESC LIMIT ?`;
            var shiftDetailsResult = await databaseUtils.executeQuery(shiftDetailsQueryString, [pid, (nozzleCountResult[0] ? nozzleCountResult[0].C : 0)]);
            shiftDetailsResult = shiftDetailsResult || [];

            // Get active reminders for dashboard slider
            var reminderQueryString = 'SELECT * FROM REMINDER WHERE PID = ? AND ACTIVE = 1 AND REMINDER_DATE >= CURRENT_DATE ORDER BY REMINDER_DATE ASC';
            var reminders = await databaseUtils.executeQuery(reminderQueryString, [pid]);
            reminders = reminders || [];

            await ctx.render('dashboard', {
                petrolpumpResult: petrolpumpResult[0] || {},
                saleResult: saleResult,
                quantityResult: quantityResult,
                cashResult: cashResult[0] || {},
                bankResult: bankResult[0] || {},
                fleetResult: fleetResult[0] || {},
                shiftResult: shiftResult[0] || {},
                shiftDetailsResult: shiftDetailsResult,
                reminders: reminders
            });
        } catch (error) {
            console.error('Error in showDashboardPage:', error);
            await ctx.render('dashboard', {
                petrolpumpResult: {},
                saleResult: [],
                quantityResult: [],
                cashResult: {},
                bankResult: {},
                fleetResult: {},
                shiftResult: {},
                shiftDetailsResult: []
            });
        }
    },


    logout: async (ctx) => {
        var sessionId = ctx.cookies.get("SESSION_ID");
        if(sessionId) {
            sessionUtils.deleteSession(sessionId);
        }
        ctx.cookies.set("SESSION_ID", '', {expires: new Date(1), path: '/'});

        ctx.redirect('/');
    },

   addNewPetrolPump: async (ctx) => {
    try {
        const body = ctx.request.body || {};
        const files = ctx.request.files || {};

        log.info('BODY:', body);
        log.info('FILES:', files);

        const { Name, Address, City, Pincode, Registration, mail, Phone, State } = body;

        if (!Name || !Address || !City || !Pincode || !Registration || !mail || !Phone || !State) {
            await ctx.render('addPetrolPump', {
                errormsg: 'All fields are required'
            });
            return;
        }

        // Insert Petrol Pump
        let pid;
        let rid;
        let errormsg;
        try {
            const res = await databaseUtils.executeQuery(
                'INSERT INTO PETROLPUMP (NAME,ADDRESS,CITY,PINCODE,REGISTRATION,EMAIL,PHONE,STATE) VALUES(?,?,?,?,?,?,?,?)',
                [Name, Address, City, Pincode, Registration, mail, Phone, State]
            );
            pid = res.lastInsertRowid;
            log.info('Created Petrol Pump with PID:', pid);

            // Admin details
            const { fname, lname, aaddress, aphone, aemail, adhaar, password } = body;

            if (!fname || !lname || !aaddress || !aphone || !aemail || !adhaar || !password) {
                throw new Error('Admin details are required');
            }

            // Default picture
            let pic = 'default.jpg';
            if (files.pic && files.pic.newFilename) {
                pic = files.pic.newFilename;
                log.info('Admin picture uploaded:', pic, 'at', files.pic.filepath);
            } else {
                log.info('No admin picture uploaded, using default.');
            }

            // Insert User (Admin)
            const res2 = await databaseUtils.executeQuery(
                'INSERT INTO USER (PID,FNAME,LNAME,ADDRESS,PHONE,EMAIL,ADHAAR,PASSWORD,PIC) VALUES(?,?,?,?,?,?,?,?,?)',
                [pid, fname, lname, aaddress, aphone, aemail, adhaar, password, pic]
            );
            const uid = res2.lastInsertRowid;
            log.info('Created Admin user with UID:', uid);

            // Insert role
            const res3 = await databaseUtils.executeQuery(
                'INSERT INTO ROLE (TYPE,PID) VALUES(\'ADMIN\',?)',
                [pid]
            );
            rid = res3.lastInsertRowid;

            await databaseUtils.executeQuery(
                'INSERT INTO USER_ROLE (PID,USER_ID,ROLE_ID) VALUES(?,?,?)',
                [pid, uid, rid]
            );
            log.info('Assigned ADMIN role to user', uid);

        } catch (e) {
            log.error('Error while creating petrol pump or admin:', e);
            if (pid) {
                await databaseUtils.executeQuery('DELETE FROM ROLE WHERE PID=?', [pid]);
                await databaseUtils.executeQuery('DELETE FROM PETROLPUMP WHERE ID=?', [pid]);
                log.info('Rolled back Petrol Pump creation for PID:', pid);
            }
            errormsg = e.message;
        }

        if (errormsg) {
            await ctx.render('addPetrolPump', {
                errormsg
            });
        } else {
            const msg = 'You have successfully created an account. Now login to proceed further...';
            await ctx.render('login', {
                msg
            });
        }
    } catch (error) {
        log.error('Unhandled error in addNewPetrolPump:', error);
        await ctx.render('addPetrolPump', {
            errormsg: 'An error occurred during registration'
        });
    }
},

    showEmpEnteriesPage: async (ctx) => {
        // var pid=ctx.request.body.fields.pid;
        // var fname=ctx.request.body.fields.firstname;
        // var lname=ctx.request.body.fields.lastname;
        // var address=ctx.request.body.fields.address;
        // var phone=ctx.request.body.fields.phone;
        // var email=ctx.request.body.fields.email;

        // var adhar=ctx.request.body.fields.adhar;
        
        // var filee=ctx.request.body.files;
        // var tph=filee.pic.path.split('\\');
        
        // var queryString1='INSERT INTO USER (PID,FNAME,LNAME,ADDRESS,PHONE,EMAIL,ADHAAR,PIC) \
        // VALUES(%s,"%s","%s","%s",%s,"%s",%s,"%s")';
        // var query1=util.format(queryString1,pid,fname,lname,address,phone,email,adhar,tph[tph.length-1]);
        // var res1=await databaseUtils.executeQuery(query1);
        var s=ctx.currentUser;
        console.log(s);
        console.log(s[0].PIC);

        await ctx.render('msg',{
    });
    },

    showEmpEnteries1Page: async (ctx) => {
        await ctx.render('empent',{

    });
},


   showNewPetrolPumpPage: async (ctx) => {
        await ctx.render('addPetrolPump',{
            errormsg:false,
    });
},


showLoginPage: async (ctx) => {
    var msg;
    console.log('Rendering login page');
    await ctx.render('login',{
        msg:msg,
});
},
showmsgpage: async (ctx) => {

    await ctx.render('msg',{

});
},
showidash: async (ctx) => {

    await ctx.render('idash',{
        
    });
},
showHeader: async (ctx) => {
    await ctx.render('newheader',{

    });
},
}
