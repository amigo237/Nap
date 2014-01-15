var fs = require('fs');
var path = require('path');
var util = require('util');
var config = require('../config/log.json');

var LEVELS = {
    'ERROR':1,
    'WARNING':2,
    'LOG':3,
    'INFO':4,
    'DEBUG':5,
    'ALL':6
};

function resolve(id) {
    var first = id.charAt(0);
    var realpath;
    
    if (first == "/") {
        realpath = path.normalize(id);
    }
    else {
        realpath = path.normalize(__dirname + "/" + id);
    }
    
    return realpath;
};

function createFlag() {
    var time = new Date();
    var year = "" + time.getFullYear();
    var month = time.getMonth() + 1;
    month = month < 10 ? "0" + month : "" + month;
    var date = time.getDate();
    date = date < 10 ? "0" + date : "" + date;
    return year + month + date;
};

function createStream(dir, type, time) {
    return fs.createWriteStream(dir + '/' + type + '.' + time + '.log', {flags: 'a', mode: '0666'});
};

function isFunction(arg) {
    return typeof arg === 'function';
}

var logdir = resolve(config.dir);
if (!fs.existsSync(logdir)) {
    fs.mkdirSync(logdir);
}

var loglevel = LEVELS[config.level];

var prependFunction = function(levelName){
    return "[" + (new Date().toString()) + "] [" + levelName + "] ";
}

function Console() {
    if (!(this instanceof Console)) {
        return new Console();
    }
    
    var time;
    
    if (config.type == "file") {
        time = createFlag();
        stdout = createStream(logdir, 'info', time);
        stderr = createStream(logdir, 'error', time);
    }
    else {
        stdout = process.stdout;
        stderr = process.stderr;
    }
    
    if (!stdout || !isFunction(stdout.write)) {
        throw new TypeError('Console expects a writable stream instance');
    }
    if (!stderr) {
        stderr = stdout;
    }
    
    var prop = {
        writable: true,
        enumerable: false,
        configurable: true
    };
    prop.value = stdout;
    Object.defineProperty(this, '_stdout', prop);
    prop.value = stderr;
    Object.defineProperty(this, '_stderr', prop);
    prop.value = time;
    Object.defineProperty(this, '_time', prop);
    
    Object.defineProperty(this, '_stdout', {
        get: function() {
            if (config.type == "file") {
                var timeTmp = createFlag();
                if (this._time !== timeTmp) {
                    this._time = timeTmp;
                    stdout = createStream(logdir, 'info', timeTmp);
                    // this._stdout.end();
                    this._stdout = stdout;
                }
            }
            return stdout;
        }
    });
    
    Object.defineProperty(this, '_stderr', {
        get: function() {
            if (config.type == "file") {
                var timeTmp = createFlag();
                if (this._time !== timeTmp) {
                    this._time = timeTmp;
                    stderr = createStream(logdir, 'error', timeTmp);
                    // this._stderr.end();
                    this._stderr = stderr;
                }
            }
            return stderr;
        }
    });

    Object.keys(Console.prototype).forEach(function(k) {
        this[k] = this[k].bind(this);
    }, this);
}

Console.prototype.log = function() {
    if (loglevel < LEVELS.LOG) {
        return this;
    }
    if(arguments && arguments.length > 0 && typeof arguments[0] == "string") {
        arguments[0] = prependFunction("LOG") + arguments[0];
    }
    else {
        [].unshift.call(arguments, prependFunction("LOG"));
    }
    this._stdout.write(util.format.apply(this, arguments) + '\n');
};

Console.prototype.info = function() {
    if (loglevel < LEVELS.INFO) {
        return this;
    }
    if(arguments && arguments.length > 0 && typeof arguments[0] == "string") {
        arguments[0] = prependFunction("INFO") + arguments[0];
    }
    else {
        [].unshift.call(arguments, prependFunction("INFO"));
    }
    this._stdout.write(util.format.apply(this, arguments) + '\n');
};

Console.prototype.warn = function() {
    if (loglevel < LEVELS.WARNING) {
        return this;
    }
    if(arguments && arguments.length > 0 && typeof arguments[0] == "string") {
        arguments[0] = prependFunction("WARNING") + arguments[0];
    }
    else {
        [].unshift.call(arguments, prependFunction("WARNING"));
    }
    this._stderr.write(util.format.apply(this, arguments) + '\n');
};

Console.prototype.error = function() {
    if (loglevel < LEVELS.ERROR) {
        return this;
    }
    if(arguments && arguments.length > 0 && typeof arguments[0] == "string") {
        arguments[0] = prependFunction("ERROR") + arguments[0];
    }
    else {
        [].unshift.call(arguments, prependFunction("ERROR"));
    }
    this._stderr.write(util.format.apply(this, arguments) + '\n');
};

Console.prototype.debug = function() {
    if (loglevel < LEVELS.DEBUG) {
        return this;
    }
    if(arguments && arguments.length > 0 && typeof arguments[0] == "string") {
        arguments[0] = prependFunction("DEBUG") + arguments[0];
    }
    else {
        [].unshift.call(arguments, prependFunction("DEBUG"));
    }
    this._stdout.write(util.format.apply(this, arguments) + '\n');
};


module.exports = new Console();