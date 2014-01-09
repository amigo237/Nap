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
        
        _selector: "$",
        
        _replaceFunc: "html",
        
        /**
            options:
                - "selector":     选择器,可以是jQuery, document.querySelector等能识别css选择器的函数，默认值为$
                - "replaceFunc":  替换函数,说明怎么替换匹配到元素的内容,可以是innerHTML,jquery的html等函数，默认值为html
        */
        config: function(options) {
            if (options) {
                this._selector = options.selector || "$";
                this._replaceFunc = options.replaceFunc || "html";
            }
        },
        
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
        
        _pipe: function(id, options) {
            var pagelet = this.get(id),
                selector = pagelet ? pagelet.selector : "",
                html = pagelet ? pagelet.html : "";
            options = options || {};
            
            if (selector) {
                res.write('<script>' + (options.selector || this._selector) + '("' + selector + '").' + (options.replaceFunc || this._replaceFunc) + '("' + html.replace(/[\r\n]*/g, '').replace(/"/g, '\\"').replace(/<\/script>/g, '<\\/script>') + '")</script>\r\n');
            }
            else {
                throw new Error('can not find pagelet(' + id + ') selector');
            }
        },
        
        //options参数同config函数
        pipePartial: function(id, html, options) {
            var pagelet = this.get(id);
            if (pagelet) {
                pagelet.html = html;
            }
            else {
                throw new Error('the pagelet(' + id + ') didn\'t register');
            }
            this._pipe(id, options);
            this._count -= 1;
            this._count <= 0 && this.pipeEnd();
        },
        
        pipeStart: function(path, callback, options) {
            options = options || {};
            var self = this;
            var charset = options.charset || "utf-8";
            
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
    
    res.setHeader("X-Accel-Buffering", "no");
    next();
};

module.exports = function() {
    return bigPipe;
};