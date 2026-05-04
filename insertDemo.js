const databaseUtils = require('./utils/databaseUtils');

// Insert demo data
async function insertDemoData() {
    try {
        // Insert demo petrol pump
        const pumpQuery = 'INSERT OR IGNORE INTO PETROLPUMP (NAME, ADDRESS, CITY, EMAIL, PHONE) VALUES (?, ?, ?, ?, ?)';
        const pumpResult = await databaseUtils.executeQuery(pumpQuery, ['Demo Petrol Pump', '123 Main St', 'Demo City', 'demo@pump.com', '1234567890']);
        const pumpId = pumpResult.lastInsertRowid || 1;

        // Insert demo role
        const roleQuery = 'INSERT OR IGNORE INTO ROLE (TYPE, PID) VALUES (?, ?)';
        const roleResult = await databaseUtils.executeQuery(roleQuery, ['ADMIN', pumpId]);
        const roleId = roleResult.lastInsertRowid || 1;

        // Insert demo user
        const userQuery = 'INSERT OR IGNORE INTO USER (PID, FNAME, LNAME, EMAIL, PASSWORD, PIC, ACTIVE) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const userResult = await databaseUtils.executeQuery(userQuery, [pumpId, 'Demo', 'User', 'demo@gmail.com', 'admin@123#', 'loginphoto.jpg', 1]);
        const userId = userResult.lastInsertRowid || 1;

        // Insert user-role link
        const userRoleQuery = 'INSERT OR IGNORE INTO USER_ROLE (PID, USER_ID, ROLE_ID) VALUES (?, ?, ?)';
        await databaseUtils.executeQuery(userRoleQuery, [pumpId, userId, roleId]);

        console.log('Demo data inserted successfully');
    } catch (error) {
        console.error('Error inserting demo data:', error);
    }
}

insertDemoData();