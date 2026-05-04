var sessionUtils = require('../utils/sessionUtils');

module.exports = {
    showTestpage: async (ctx) => {
        await ctx.render('gla',{

        });
    }
}
