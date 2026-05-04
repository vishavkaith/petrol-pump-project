var sessionUtils = require('../utils/sessionUtils');
var databaseUtils=require('./../utils/databaseUtils');
var util=require('util');

module.exports = {
    showiProductPage: async (ctx) => {
        var pid;
        try{ pid=ctx.currentUser[0].PID;}
        catch(e){pid=0;}
        var ptype=ctx.request.query.ptype;
        var pname=ctx.request.query.pname;
        console.log(pid,pname,ptype);
        if(pname && pname!='All'){
            var productDetails=await databaseUtils.executeQuery('SELECT * FROM PRODUCT WHERE PID=? AND NAME=?', [pid, pname]);
        }
        else if(ptype && ptype!='All'){
            var productDetails=await databaseUtils.executeQuery('SELECT * FROM PRODUCT WHERE PID=? AND TYPE=?', [pid, parseInt(ptype)]);
        }
        else{
            var productDetails=await databaseUtils.executeQuery('SELECT * FROM PRODUCT WHERE PID=?', [pid]);
        }

            var productname=await databaseUtils.executeQuery('SELECT NAME FROM PRODUCT WHERE PID=?', [pid]);

            await ctx.render('iproduct',{
                productDetails:productDetails,
                productname:productname,
                pname:pname,
                ptype:ptype,
        });
    },
    showiProduct2Page: async (ctx) => {
        var pid;
try{ pid=ctx.currentUser[0].PID;}
catch(e){pid=0;}


        var queryString;
        var query;
        var productDetails
        
        var ppid=ctx.request.body.ppid;
        var name=ctx.request.body.name;
        var type=ctx.request.body.type;
        var price=ctx.request.body.price;
        var qty=ctx.request.body.qty;

        var act=ctx.request.body.act;
        var ptype=ctx.request.body.type;
        var pname=ctx.request.body.name;

        var productDetails=await databaseUtils.executeQuery('SELECT * FROM PRODUCT WHERE PID=?', [pid]);
        
        if(ppid==undefined){
            if(act=="0"){
                    if(pname=='all') pname="%";
                    if(ptype=="all"){
                        productDetails=await databaseUtils.executeQuery('SELECT * FROM PRODUCT WHERE PID=? AND NAME LIKE ?', [pid, pname]);
                    }
                    else{
                        productDetails=await databaseUtils.executeQuery('SELECT * FROM PRODUCT WHERE PID=? AND TYPE=? AND NAME LIKE ?', [pid, ptype, pname]);
                    }
            }
            else if(act=="1"){
                    var res=await databaseUtils.executeQuery('INSERT INTO PRODUCT (PID,NAME,TYPE,PRICE,QTY) VALUES(?,?,?,?,?)', [pid, pname, ptype, price, qty]);
                    productDetails=await databaseUtils.executeQuery('SELECT * FROM PRODUCT WHERE PID=?', [pid]);
                    
            }

        }
        else{
            var r=await databaseUtils.executeQuery('UPDATE PRODUCT SET NAME=?,TYPE=?,PRICE=?,QTY=? WHERE ID=?', [name, type, price, qty, ppid]);
        }

            
            

            var productname=await databaseUtils.executeQuery('SELECT NAME FROM PRODUCT WHERE PID=?', [pid]);

            ctx.redirect('/app/iproduct');
},
    showiTankPage: async (ctx) => {
        var pid;
try{ pid=ctx.currentUser[0].PID;}
catch(e){pid=0;}


        var ttype=ctx.request.query.ttype;
        if((!ttype) || ttype=='All'){
            var DetailtankResult=await databaseUtils.executeQuery('SELECT ID,CAPACITY,TYPE,ACTIVE FROM TANK_METADATA WHERE PID=?', [pid]);
        }
        else{
            var DetailtankResult=await databaseUtils.executeQuery('SELECT ID,CAPACITY,TYPE,ACTIVE FROM TANK_METADATA WHERE PID=? AND TYPE=?', [pid, ttype]);
        }
        
        var tankType=await databaseUtils.executeQuery('SELECT DISTINCT(TYPE) FROM TANK_METADATA WHERE PID=?', [pid]);
        await ctx.render('itank',{
            DetailtankResult:DetailtankResult,
            tankType:tankType,
            ttype:ttype,
    });
},
showiTank2Page: async (ctx) => {
    try {
        var pid;
        try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

        const body = ctx.request.body || {};
        const tid = body.tid;
        const cap = body.capacity;
        const type = body.type;

        if (tid && cap && type) {
            await databaseUtils.executeQuery(
                'UPDATE TANK_METADATA SET CAPACITY=?, TYPE=? WHERE ID=?',
                [cap, type, tid]
            );
        }

        const pid_body = body.pid;
        const cap_body = body.capacity;
        const type_body = body.type;

        if (pid_body && cap_body && type_body) {
            await databaseUtils.executeQuery(
                'INSERT INTO TANK_METADATA (PID, CAPACITY, TYPE) VALUES (?, ?, ?)',
                [pid_body, cap_body, type_body]
            );
        }

        const wf = body.ttype;
        let DetailtankResult;

        if (wf === 'all') {
            DetailtankResult = await databaseUtils.executeQuery(
                'SELECT ID, CAPACITY, TYPE, ACTIVE FROM TANK_METADATA WHERE PID=?',
                [pid]
            );
        } else if (wf) {
            DetailtankResult = await databaseUtils.executeQuery(
                'SELECT ID, CAPACITY, TYPE, ACTIVE FROM TANK_METADATA WHERE PID=? AND TYPE=?',
                [pid, wf]
            );
        } else {
            DetailtankResult = await databaseUtils.executeQuery(
                'SELECT ID, CAPACITY, TYPE, ACTIVE FROM TANK_METADATA WHERE PID=?',
                [pid]
            );
        }

        const tankType = await databaseUtils.executeQuery(
            'SELECT DISTINCT(TYPE) FROM TANK_METADATA WHERE PID=?',
            [pid]
        );

        ctx.redirect('/app/itank');
    } catch (error) {
        console.error('Error in showiTank2Page:', error);
        ctx.redirect('/app/itank');
    }
},
showiTank3Page: async (ctx) => {
    try {
        var pid;
        try { pid = ctx.currentUser[0].PID; } catch (e) { pid = 0; }

        const body = ctx.request.body || {};
        const cap = body.capacity;
        const type = body.type;
        const act = (body.tid || '').split(' ');

        if (parseInt(act[0]) === 1) {
            // ADD
            if (cap && type) {
                await databaseUtils.executeQuery(
                    'INSERT INTO TANK_METADATA (PID, CAPACITY, TYPE) VALUES (?, ?, ?)',
                    [pid, cap, type]
                );
            }
        } else {
            // EDIT
            const tid = parseInt(act[1]);
            if (cap && type && tid) {
                await databaseUtils.executeQuery(
                    'UPDATE TANK_METADATA SET CAPACITY=?, TYPE=? WHERE ID=?',
                    [cap, type, tid]
                );
            }
        }

        ctx.redirect('/app/itank');
    } catch (error) {
        console.error('Error in showiTank3Page:', error);
        ctx.redirect('/app/itank');
    }
},
}
