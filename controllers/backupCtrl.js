const databaseUtils = require('../utils/databaseUtils');

module.exports = {
    showBackupPage: async (ctx) => {
        await ctx.render('backup', {
            currentUser: ctx.currentUser
        });
    },

    exportDatabase: async (ctx) => {
        try {
            const fs = require('fs');
            const path = require('path');
            const dbDir = path.join(
                process.env.APPDATA || __dirname,
                'PetrolApp'
            );
            const dbPath = path.join(dbDir, 'petrol.db');
            
            console.log('DB path being used for export:', dbPath);
            
            if (fs.existsSync(dbPath)) {
                const fileContent = fs.readFileSync(dbPath);
                ctx.set('Content-Type', 'application/octet-stream');
                ctx.set('Content-Disposition', 'attachment; filename="petrol_backup.db"');
                ctx.body = fileContent;
            } else {
                console.error('Database file not found at:', dbPath);
                ctx.body = 'Database file not found';
                ctx.status = 404;
            }
        } catch (error) {
            console.error('Export error:', error);
            ctx.body = 'Export failed';
            ctx.status = 500;
        }
    },

    importDatabase: async (ctx) => {
        try {
            const fs = require('fs');
            const path = require('path');
            const dbDir = path.join(
                process.env.APPDATA || __dirname,
                'PetrolApp'
            );
            const dbPath = path.join(dbDir, 'petrol.db');
            
            console.log('DB path being used for import:', dbPath);
            
            const file = ctx.request.body.files.file;
            if (file && file.path) {
                // Backup current database
                if (fs.existsSync(dbPath)) {
                    fs.copyFileSync(dbPath, dbPath + '.backup');
                }
                
                // Copy uploaded file
                fs.copyFileSync(file.path, dbPath);
                
                ctx.redirect('/app/backup?message=Import successful');
            } else {
                ctx.redirect('/app/backup?error=No file uploaded');
            }
        } catch (error) {
            console.error('Import error:', error);
            ctx.redirect('/app/backup?error=Import failed');
        }
    }
};