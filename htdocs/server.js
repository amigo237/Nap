global.rootPath = __dirname;
var fs = require('fs');
var util = require("util");
var cluster = require('cluster');
var express = require('express');
var app = express();
var ejs = require('ejs');
var logger = require('./lib/logger');
var appConfig = require('./config/app.json');

if (cluster.isMaster) {
    require('os').cpus().forEach(function() {
        cluster.fork();
    });
    cluster.on('death', function(worker) {
        logger.log('worker ' + worker.pid + ' died');
        cluster.fork();
    });
    cluster.on('exit', function(worker, code, signal) {
        logger.log('worker ' + worker.process.pid + ' died');
    });
    cluster.on('listening', function(worker, address) {
        logger.log("A worker with #" + worker.id + " is now connected to " + address.address + ":" + address.port);
    });
}
else {
    app.engine('.html', ejs.__express);
    app.set('views', __dirname + '/view');
    app.set('view engine', 'html');
    app.use(express.cookieParser());
    ejs.open = '{{';
    ejs.close = '}}';
    
    app.get(/.*/, function(req, res) {
        var indexReg = /(.*)\/$/i;
        var staticPageReg = /(.*)\/(?:(?:([^\/]+)\.[^\/\.]*)|([^\/\.]+))/i;
        var path = req.path;
        var result = null;
        var controller = "", action = "";
        
        if ((result = path.match(indexReg)) != null) {
            controller = result[1] || "/root";
            action = "index";
        }
        else if ((result = path.match(staticPageReg)) != null) {
            controller = result[1] || "/root";
            action = result[2] || result[3];
        }
        
        var modulePath = __dirname + "/controller" + controller;
        var module = null;
        fs.exists(modulePath + ".js", function (exists) {
            if (exists) {
                module = require(modulePath);
            }

            if (module && module[action]) {
                module[action](req, res);
            }
            else {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write("can not find the controller's action");
                res.end();
            }
        });
    });
    
    app.listen(appConfig.port);
}