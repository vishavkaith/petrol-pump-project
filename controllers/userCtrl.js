
const databaseUtils = require('../utils/databaseUtils');
const sessionUtils = require('../utils/sessionUtils');

module.exports = {
    login: async (ctx) => {
        try {
            const body = ctx.request.body || {};
            const user = body.email;
            const pwd = body.psw;

            if (!user || !pwd) {
                ctx.redirect('/app/login');
                return;
            }

            const userResult = await databaseUtils.executeQuery(
                `SELECT U.ID, U.PID, FNAME, LNAME, ADDRESS, PHONE, EMAIL, PASSWORD, PIC, R.TYPE 
                 FROM USER U 
                 JOIN USER_ROLE UR ON U.ID = UR.USER_ID 
                 JOIN ROLE R ON R.ID = UR.ROLE_ID 
                 WHERE EMAIL = ? AND PASSWORD = ?`,
                [user, pwd]
            );

            if (userResult && userResult.length > 0) {
                // Check if this is a VS Code Simple Browser request
                const vscodeReqId = ctx.query.vscodeBrowserReqId;
                if (vscodeReqId) {
                    // For VS Code Simple Browser, use the vscodeReqId as session ID
                    var sessionObj = {user: userResult};
                    sessionUtils.sessions.set(vscodeReqId, sessionObj);
                    ctx.cookies.set("SESSION_ID", vscodeReqId, {
                        httpOnly: false,
                        maxAge: 24 * 60 * 60 * 1000,
                        path: '/'
                    });
                    ctx.redirect('/app/idash');
                } else {
                    // Normal browser
                    sessionUtils.saveUserInSession(userResult, ctx.cookies);
                    ctx.redirect('/app/idash');
                }
            } else {
                ctx.redirect('/app/login');
            }
        } catch (error) {
            console.error('Error in login:', error);
            ctx.redirect('/app/login');
        }
    },

    signup: async (ctx) => {
        try {
            const body = ctx.request.body || {};
            const name = body.name;
            const email = body.email;
            const pwd = body.password;

            if (!name || !email || !pwd) {
                ctx.redirect('/app/login');
                return;
            }

            const result = await databaseUtils.executeQuery(
                'INSERT INTO USER (FNAME, EMAIL, PASSWORD) VALUES (?, ?, ?)',
                [name, email, pwd]
            );

            try {
                const userResult = await databaseUtils.executeQuery(
                    'SELECT * FROM USER WHERE ID = ?',
                    [result.lastInsertRowid]
                );

                if (userResult && userResult.length > 0) {
                    sessionUtils.saveUserInSession(userResult[0], ctx.cookies);
                }
            } catch (e) {
                console.error('Error retrieving inserted user:', e);
            }

            ctx.redirect('/app/msg');
        } catch (error) {
            console.error('Error in signup:', error);
            if (error.code === 'SQLITE_CONSTRAINT') {
                // Handle duplicate email or other constraints
            }
            ctx.redirect('/app/login');
        }
    },

    logout: async (ctx) => {
        try {
            const sessionId = ctx.cookies.get("SESSION_ID");
            if (sessionId) {
                sessionUtils.deleteSession(sessionId);
            }
            ctx.cookies.set("SESSION_ID", '', { expires: new Date(1), path: '/' });
            ctx.redirect('/app/login');
        } catch (error) {
            console.error('Error in logout:', error);
            ctx.redirect('/app/login');
        }
    },

    showProfile: async (ctx) => {
        try {
            let userId = null;
            try { userId = ctx.currentUser[0].ID; } catch (e) {}

            if (!userId) {
                ctx.redirect('/app/login');
                return;
            }

            const userResult = await databaseUtils.executeQuery(
                'SELECT * FROM USER WHERE ID = ?',
                [userId]
            );

            if (userResult && userResult.length > 0) {
                await ctx.render('profile', {
                    currentUser: ctx.currentUser,
                    user: userResult[0]
                });
            } else {
                ctx.redirect('/app/idash');
            }
        } catch (error) {
            console.error('Error in showProfile:', error);
            ctx.redirect('/app/idash');
        }
    },

    updateProfile: async (ctx) => {
        try {
            let userId = null;
            try { userId = ctx.currentUser[0].ID; } catch (e) {}

            if (!userId) {
                ctx.redirect('/app/login');
                return;
            }

            const body = ctx.request.body || {};
            const fname = body.fname;
            const lname = body.lname;
            const phone = body.phone;
            const address = body.address;

            if (fname || lname || phone || address) {
                await databaseUtils.executeQuery(
                    'UPDATE USER SET FNAME = ?, LNAME = ?, PHONE = ?, ADDRESS = ? WHERE ID = ?',
                    [fname, lname, phone, address, userId]
                );
            }

            ctx.redirect('/app/profile');
        } catch (error) {
            console.error('Error in updateProfile:', error);
            ctx.redirect('/app/profile');
        }
    }
};
