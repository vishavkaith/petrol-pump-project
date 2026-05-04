var Router= require('koa-router');
var { koaBody } = require('koa-body');

module.exports = function(app){

    var router = new Router();

    //Welcome Routes
    var welcomeCtrl = require('./../controllers/WelcomeCtrl');
    router.get('/gla', welcomeCtrl.showTestpage);

    return router.middleware();
}