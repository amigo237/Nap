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

function bigpipe(req, res, next) {
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
        
        pipePartial: function(id) {
            this.pipe(id);
            this._count -= 1;
            this._count <= 0 && this.pipeEnd();
        },
        
        pipeStart: function(html, callback, charset) {
            var self = this;
            charset = charset || "utf-8";
            
            if (html.indexOf("<\/body>") != -1 || html.indexOf("<\/html>") != -1) {
                self.extractPipe(html);
                res.writeHead(200, {'Content-Type': 'text/html; charset=' + charset});
                res.write(html.replace(/<\/body>[\s\r\n]*<\/html>[\s\r\n]*$/g, ""));
                isFunction(callback) && callback(null,null);
            }
            else {
                fs.readFile(resolve(html), function (err, data) {
                    if (err) {
                        res.writeHead(404, {'Content-Type': 'text/html'});
                        res.end('page not found');
                    }
                    else {
                        html = data.toString();
                        self.extractPipe(html);
                        res.writeHead(200, {'Content-Type': 'text/html; charset=' + charset});
                        res.write(html.replace(/<\/body>[\s\r\n]*<\/html>[\s\r\n]*$/g, ""));
                        isFunction(callback) && callback(null,null);
                    }
                });
            }
        },
        
        pipeEnd: function() {
            res.write('\r\n<\/body>\r\n<\/html>');
            res.end();
        },
        
        extractPipe: function(html) {
            var pipeReg = /<pipetemplate\b([^>]*)>([\s\S]*?)<\/pipetemplate>/g;
            var template;
            while ((template = pipeReg.exec(html)) != null) {
                var id = this.attr(template[1], "id"),
                    selector = this.attr(template[1], "selector"),
                    content = template[2];
                
                if (id && selector) {
                    this.register(id, selector, content);
                }
                else {
                    throw new Error('missing id or selector when register pagelet, id = ' + id + ';' + ' selector = ' + selector);
                }
            }
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

module.exports = bigpipe;