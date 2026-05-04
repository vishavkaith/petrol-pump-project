var uuid = require('uuid');

// In-memory session store
var sessions = new Map();

module.exports = {
    sessions: sessions,  // Export sessions map for direct access
    saveUserInSession: function(user, cookies) {
        var sessionId = uuid.v1();
        var sessionObj = {user: user};
        sessions.set(sessionId, sessionObj);
        cookies.set("SESSION_ID", sessionId, {
            httpOnly: false,  // Allow JavaScript access for Simple Browser
            maxAge: 24 * 60 * 60 * 1000,  // 24 hours
            path: '/'
        });
    },

    updateUserInSession: function(user, cookies) {
        var sessionId = cookies.get("SESSION_ID");
        var sessionObj = {user: user};
        sessions.set(sessionId, sessionObj);
    },

    getCurrentUser: function(sessionId) {
        if(sessionId) {
            var sessionObj = sessions.get(sessionId);
            if(sessionObj) {
                return sessionObj.user;
            }
        }
        return null;
    },

    deleteSession: function(sessionId) {
        sessions.delete(sessionId);
    }
}
