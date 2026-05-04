const databaseUtils = require('../utils/databaseUtils');

module.exports = {
    showReminderPage: async (ctx) => {
        try {
            let pid = null;
            try { pid = ctx.currentUser[0].PID; } catch (e) {}

            // WHY: Do not query with PID=0, return empty data instead
            if (!pid) {
                await ctx.render('reminder', {
                    currentUser: ctx.currentUser,
                    reminders: []
                });
                return;
            }

            // WHY: Show all reminders (active and inactive) so users can manage them
            const reminders = await databaseUtils.executeQuery(
                'SELECT * FROM REMINDER WHERE PID = ? ORDER BY ACTIVE DESC, REMINDER_DATE DESC',
                [pid]
            ) || [];

            console.log('Reminder results count:', reminders.length);

            await ctx.render('reminder', {
                currentUser: ctx.currentUser,
                reminders: reminders
            });
        } catch (error) {
            console.error('Error in showReminderPage:', error);
            await ctx.render('reminder', {
                currentUser: ctx.currentUser,
                reminders: []
            });
        }
    },

    addReminder: async (ctx) => {
        try {
            let pid = null;
            try { pid = ctx.currentUser[0].PID; } catch (e) {}

            // WHY: Do not insert with PID=0
            if (!pid) {
                ctx.redirect('/app/reminder');
                return;
            }

            const body = ctx.request.body || {};
            const task = body.task;
            const reminder_date = body.reminder_date;

            if (task && reminder_date) {
                await databaseUtils.executeQuery(
                    'INSERT INTO REMINDER (PID, TASK, REMINDER_DATE, ACTIVE) VALUES (?, ?, ?, 1)',
                    [pid, task, reminder_date]
                );
            }

            ctx.redirect('/app/reminder');
        } catch (error) {
            console.error('Error in addReminder:', error);
            ctx.redirect('/app/reminder');
        }
    },

    toggleReminder: async (ctx) => {
        try {
            const body = ctx.request.body || {};
            const id = body.id;

            if (id) {
                const current = await databaseUtils.executeQuery('SELECT ACTIVE FROM REMINDER WHERE ID = ?', [id]);
                if (current.length > 0) {
                    const newActive = current[0].ACTIVE ? 0 : 1;
                    await databaseUtils.executeQuery('UPDATE REMINDER SET ACTIVE = ? WHERE ID = ?', [newActive, id]);
                }
            }

            ctx.redirect('/app/reminder');
        } catch (error) {
            console.error('Error in toggleReminder:', error);
            ctx.redirect('/app/reminder');
        }
    },

    deleteReminder: async (ctx) => {
        try {
            const body = ctx.request.body || {};
            const id = body.id;

            if (id) {
                await databaseUtils.executeQuery('DELETE FROM REMINDER WHERE ID = ?', [id]);
            }

            ctx.redirect('/app/reminder');
        } catch (error) {
            console.error('Error in deleteReminder:', error);
            ctx.redirect('/app/reminder');
        }
    },

    getActiveReminders: async (ctx) => {
        try {
            var pid;
            try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

            // Get reminders that are active and have reminder date >= today
            const reminders = await databaseUtils.executeQuery(
                'SELECT * FROM REMINDER WHERE PID = ? AND ACTIVE = 1 AND REMINDER_DATE >= CURRENT_DATE ORDER BY REMINDER_DATE ASC',
                [pid]
            ) || [];

            ctx.body = reminders;
        } catch (error) {
            console.error('Error in getActiveReminders:', error);
            ctx.body = [];
        }
    }
};