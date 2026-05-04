const databaseUtils = require('./utils/databaseUtils');

async function checkDemoUser() {
    try {
        const query = 'SELECT U.ID, U.FNAME, U.LNAME, U.EMAIL, U.PASSWORD, R.TYPE FROM USER U, ROLE R, USER_ROLE UR WHERE U.ID=UR.USER_ID AND R.ID=UR.ROLE_ID AND U.EMAIL=?';
        const result = await databaseUtils.executeQuery(query, ['demo@gmail.com']);
        console.log('Demo user found:', result);
    } catch (error) {
        console.error('Error checking demo user:', error);
    }
}

checkDemoUser();