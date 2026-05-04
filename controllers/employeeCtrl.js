const sessionUtils = require('../utils/sessionUtils');
const databaseUtils = require('../utils/databaseUtils');
const path = require('path');
const fs = require('fs');

module.exports = {
    showiemployeePage: async (ctx) => {
        try {
            let pid = null;
            try { pid = ctx.currentUser[0].PID; } catch (e) {}

            // WHY: Do not query with PID=0, return empty data instead
            if (!pid) {
                await ctx.render('iemployee', {
                    employeeResult: [],
                    employeeRole: []
                });
                return;
            }

            const employeeResult = await databaseUtils.executeQuery(
                `SELECT U.ID, U.FNAME, U.LNAME, U.ADDRESS, U.EMAIL, U.PHONE, U.ADHAAR, U.PIC, U.ACTIVE, R.TYPE AS TYPE
                 FROM USER U
                 LEFT JOIN USER_ROLE UR ON U.ID = UR.USER_ID
                 LEFT JOIN ROLE R ON UR.ROLE_ID = R.ID
                 WHERE U.PID = ?`,
                [pid]
            ) || [];

            await ctx.render('iemployee', {
                employeeResult: employeeResult,
                employeeRole: await databaseUtils.executeQuery('SELECT DISTINCT TYPE FROM ROLE WHERE PID=?', [pid]) || []
            });
        } catch (error) {
            console.error('Error in showiemployeePage:', error);
            await ctx.render('iemployee', {
                employeeResult: [],
                employeeRole: []
            });
        }
    },

    showiEmployee2Page: async (ctx) => {
        try {
            console.log('🔥 HIT showiEmployee2Page');
            const body = ctx.request.body || {};
            const files = ctx.request.files || {};
            console.log('BODY:', body);
            console.log('FILES:', files);

            let pid = null;
            try { pid = ctx.currentUser[0].PID; } catch (e) {}

            // WHY: Do not process with PID=0, redirect instead
            if (!pid) {
                ctx.redirect('/app/iemployee');
                return;
            }

            const act = (body.act || '').split(' ');

            // =======================
            // ADD EMPLOYEE
            // =======================
            if (act[0] === '3') {
                const FNAME = body.FNAME;
                const LNAME = body.LNAME;
                const ADDRESS = body.ADDRESS;
                const EMAIL = body.EMAIL;
                const PHONE = body.PHONE;
                const ADHAAR = body.ADHAAR;
                const pwd = body.pwd;
                const TYPE = body.TYPE;
                const abc = body.abc;
                const ACTIVE = body.ACTIVE || 1;

                if (!FNAME || !LNAME || !ADDRESS || !EMAIL || !PHONE || !ADHAAR || !pwd || !TYPE) {
                    throw new Error('All fields are required');
                }

                let roleType = TYPE === 'Other' ? (abc || 'Other') : TYPE;
                let pic = 'default.png';

                if (files.pic && files.pic.newFilename) {
                    pic = files.pic.newFilename;
                }

                const res = await databaseUtils.executeQuery(
                    `INSERT INTO USER
                     (PID,FNAME,LNAME,ADDRESS,EMAIL,PHONE,ADHAAR,PASSWORD,PIC,ACTIVE)
                     VALUES (?,?,?,?,?,?,?,?,?,?)`,
                    [
                        pid, FNAME, LNAME, ADDRESS, EMAIL,
                        PHONE, ADHAAR, pwd, pic, ACTIVE
                    ]
                );

                const uid = res.lastInsertRowid;

                let role = await databaseUtils.executeQuery(
                    'SELECT ID FROM ROLE WHERE PID=? AND TYPE=?',
                    [pid, roleType]
                );

                let rid;
                if (role.length === 0) {
                    const r = await databaseUtils.executeQuery(
                        'INSERT INTO ROLE (TYPE,PID) VALUES (?,?)',
                        [roleType, pid]
                    );
                    rid = r.lastInsertRowid;
                } else {
                    rid = role[0].ID;
                }

                await databaseUtils.executeQuery(
                    'INSERT INTO USER_ROLE (PID,USER_ID,ROLE_ID) VALUES (?,?,?)',
                    [pid, uid, rid]
                );
            }

            // =======================
            // EDIT EMPLOYEE
            // =======================
            else if (act[0] === '2') {
                const uid = parseInt(act[1]);

                const FNAME = body.FNAME;
                const LNAME = body.LNAME;
                const ADDRESS = body.ADDRESS;
                const EMAIL = body.EMAIL;
                const PHONE = body.PHONE;
                const ADHAAR = body.ADHAAR;
                const pwd = body.pwd;
                const TYPE = body.TYPE;
                const abc = body.abc;
                const ACTIVE = body.ACTIVE || 1;
                const old_pic = body.old_pic;

                if (!FNAME || !LNAME || !ADDRESS || !EMAIL || !PHONE || !ADHAAR || !TYPE) {
                    throw new Error('All fields are required');
                }

                let roleType = TYPE === 'Other' ? (abc || 'Other') : TYPE;

                // Handle image: prioritize new file, fallback to old_pic, then default
                let pic = 'default.png';
                if (files.pic && files.pic.newFilename) {
                    pic = files.pic.newFilename;
                } else if (old_pic && old_pic !== 'undefined') {
                    pic = old_pic;
                }

                const updateRes = await databaseUtils.executeQuery(
                    `UPDATE USER SET
                        FNAME=?,
                        LNAME=?,
                        ADDRESS=?,
                        EMAIL=?,
                        PHONE=?,
                        ADHAAR=?,
                        PASSWORD=?,
                        PIC=?,
                        ACTIVE=?
                     WHERE ID=? AND PID=?`,
                    [
                        FNAME, LNAME, ADDRESS, EMAIL, PHONE,
                        ADHAAR, pwd || 'password', pic, ACTIVE,
                        uid, pid
                    ]
                );

                // ROLE UPDATE
                let role = await databaseUtils.executeQuery(
                    'SELECT ID FROM ROLE WHERE PID=? AND TYPE=?',
                    [pid, roleType]
                );

                let rid;
                if (role.length === 0) {
                    const r = await databaseUtils.executeQuery(
                        'INSERT INTO ROLE (TYPE,PID) VALUES (?,?)',
                        [roleType, pid]
                    );
                    rid = r.lastInsertRowid;
                } else {
                    rid = role[0].ID;
                }

                await databaseUtils.executeQuery(
                    'UPDATE USER_ROLE SET ROLE_ID=? WHERE USER_ID=? AND PID=?',
                    [rid, uid, pid]
                );

                console.log('✅ Employee updated:', { uid, FNAME, LNAME, pic });
            }

            // =======================
            // DELETE (HARD)
            // =======================
            else if (act[0] === '4') {
                const uid = parseInt(act[2]);

                if (!uid || uid === 0) {
                    throw new Error('Invalid employee ID');
                }

                // fetch existing pic name to remove file if present
                const userRows = await databaseUtils.executeQuery('SELECT PIC FROM USER WHERE ID=? AND PID=?', [uid, pid]);
                const picName = (userRows && userRows[0] && userRows[0].PIC) ? userRows[0].PIC : null;

                // delete user roles first
                await databaseUtils.executeQuery('DELETE FROM USER_ROLE WHERE USER_ID=? AND PID=?', [uid, pid]);

                // delete user record
                await databaseUtils.executeQuery('DELETE FROM USER WHERE ID=? AND PID=?', [uid, pid]);

                // remove uploaded pic file if it exists and is not the default
                try {
                    if (picName && picName !== 'default.png') {
                        const uploadsDir = path.join(__dirname, '..', 'static', 'uploads');
                        const picPath = path.join(uploadsDir, picName);
                        if (fs.existsSync(picPath)) {
                            fs.unlinkSync(picPath);
                            console.log('✅ Removed employee picture:', picPath);
                        }
                    }
                } catch (fsErr) {
                    console.error('Error deleting employee picture file:', fsErr);
                }

                console.log('✅ Employee deleted:', { uid });
            }

            ctx.redirect('/app/iemployee');
        } catch (error) {
            console.error('Error in showiEmployee2Page:', error);
            ctx.redirect('/app/iemployee');
        }
    }
};
