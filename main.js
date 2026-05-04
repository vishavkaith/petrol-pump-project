const log = require('electron-log');

// Redirect console.log/error
console.log = log.info;
console.error = log.error;

log.info('Loading main.js');

const { app: electronApp } = require('electron');
const Koa = require('koa');
const app = new Koa();
const mount = require('koa-mount');
const views = require('koa-views');
const path = require('path');
const fs = require('fs');
const { koaBody } = require('koa-body');
const sessionUtils = require('./utils/sessionUtils');
const databaseUtils = require('./utils/databaseUtils');
const serve = require('koa-static');

// ---------------------------
// SAFE upload directory (outside app.asar)
// ---------------------------
let uploadDir;

if (electronApp && electronApp.getPath) {
    uploadDir = path.join(electronApp.getPath('userData'), 'uploads');
} else {
    uploadDir = path.join(__dirname, 'uploads');
}

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    log.info('Created upload directory at: ' + uploadDir);
}

// ---------------------------
// Koa Body (file upload)
// ---------------------------
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: uploadDir,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024
    }
}));

// ---------------------------
// Views
// ---------------------------
app.use(views(path.join(__dirname, 'views'), {
    extension: 'html',
    map: { html: 'ejs' },
    cache: false
}));

log.info('Views setup done');

// ---------------------------
// Middleware
// ---------------------------
app.use(async (ctx, next) => {
    let sessionId = ctx.cookies.get("SESSION_ID");

    ctx.currentUser = sessionUtils.getCurrentUser(sessionId);
    ctx.state.currentUser = ctx.currentUser;

    // 🔥 REQUIRED for EJS templates
    ctx.state.title = 'Petrol Pump System';
    ctx.state.description = 'Petrol Pump Management Software';
    ctx.state.metaImageUrl = '/static/images/logo.png';
    ctx.state.canonicalUrl = ctx.href;
    ctx.state.utils = require('./ejsHelpers');

    await next();
});
// ---------------------------
// Logger middleware
// ---------------------------
app.use(async (ctx, next) => {
    log.info(`REQUEST: ${ctx.method} ${ctx.path}`);
    await next();
});

log.info('Middleware setup done');

// ---------------------------
// Routes
// ---------------------------
const appRoutes = require('./routes/appRoutes');
app.use(mount('/app', appRoutes.routes()));
app.use(mount('/app', appRoutes.allowedMethods()));

// ---------------------------
// Static files (CSS/JS/images inside project)
// ---------------------------
app.use(mount('/static', serve(path.join(__dirname, 'static'))));
log.info('Static route mounted');

// ---------------------------
// ✅ Uploaded files route
// This matches: /static/uploads/filename.png
// ---------------------------
app.use(mount('/static/uploads', serve(uploadDir)));
log.info('Uploads route mounted');

// ---------------------------
// Start server
// ---------------------------
const http = require('http');
const server = http.createServer(app.callback());

server.listen(3001, () => {
    log.info('Server listening on port 3001');
});