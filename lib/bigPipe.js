var fs = require('fs');
var path = require("path");

function isType(type) {
    return function(obj) {
        return {}.toString.call(obj) == "[object " + type + "]";
    }
};

var isObject = isType("Object");
var isString = isType("String");
var isArray = Array.isArray || isType("Array");
var isFunction = isType("Function");
    
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

var Pagelet = function(id, selector, html) {
    this.id = id;
    this.selector = selector;
    this.html = html;
};

function bigPipe(req, res, next) {
    res.pipeManager = {
        _cache: {},
        
        _count: 0,
        
        get: function(id) {
            return this._cache[id];
        },
        
        register: function(id, selector, html) {
            if (!this._cache[id]) {
                this._cache[id] = new Pagelet(id, selector, html);
                this._count += 1;
            }
            return this._cache[id];
        },
        
        pipe: function(id) {
            var pagelet = this.get(id),
                selector = pagelet ? pagelet.selector : "",
                html = pagelet ? pagelet.html : "";
                
            if (selector) {
                res.write('<script>' + '$("' + selector + '").html' + '("' + html.replace(/[\r\n]*/g, '').replace(/"/g, '\\"').replace(/<\/script>/g, '<\\/script>') + '")</script>');
            }
            else {
                throw new Error('can not find pagelet(' + id + ') selector');
            }
        },
        
        pipePartial: function(id, html) {
            var pagelet = this.get(id);
            if (pagelet) {
                pagelet.html = html;
            }
            else {
                throw new Error('the pagelet(' + id + ') didn\'t register');
            }
            this.pipe(id);
            this._count -= 1;
            this._count <= 0 && this.pipeEnd();
        },
        
        pipeStart: function(path, callback, charset) {
            var self = this;
            charset = charset || "utf-8";
            
            fs.readFile(resolve(path), function (err, data) {
                if (err) {
                    // res.writeHead(404, {'Content-Type': 'text/html'});
                    // res.end('page not found');
                    isFunction(callback) && callback(err, null);
                }
                else {
                    var html = data.toString();
                    html = self.extractPipe(html);
                    res.writeHead(200, {'Content-Type': 'text/html; charset=' + charset});
                    res.write(html.replace(/<\/body>[\s\r\n]*<\/html>[\s\r\n]*$/g, ""));
                    isFunction(callback) && callback(null, null);
                }
            });
        },
        
        pipeStartSync: function(html, charset) {
            charset = charset || "utf-8";
            this.extractPipe(html);
            res.writeHead(200, {'Content-Type': 'text/html; charset=' + charset});
            res.write(html.replace(/<\/body>[\s\r\n]*<\/html>[\s\r\n]*$/g, ""));
        },
        
        pipeEnd: function() {
            res.write('\r\n<\/body>\r\n<\/html>');
            res.end();
        },
        
        extractPipe: function(html) {
            var pipeReg = /<pipetemplate\b([^>]*)>([\s\S]*?)<\/pipetemplate>[\r\n\s]*/g;
            var self = this;
            var template;
            
            return html.replace(pipeReg, function(m, m1, m2) {
                var id = self.attr(m1, "id"),
                    selector = self.attr(m1, "selector"),
                    content = m2;
                
                if (id && selector) {
                    self.register(id, selector, content);
                }
                else {
                    throw new Error('missing id or selector when register pagelet, id = ' + id + ';' + ' selector = ' + selector);
                }
                
                return "";
            });
        },
        
        attr: function(str, key) {
            var reg = new RegExp("\\b" + key + "\\s*=\\s*(?:\"(\\\"|[^\"]*)\"|'(\\'|[^']*)')", "g");
            var result;
            if (str.match(reg)) {
                result = RegExp.$1 || RegExp.$2;
            }
            else {
                result = null;
            }
            return result;
        }
    };
    
    //关闭nginx代理的缓存
    res.setHeader("X-Accel-Buffering", "no");
    next();
};

module.exports = function() {
    return bigPipe;
};