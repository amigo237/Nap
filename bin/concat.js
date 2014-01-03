#!/usr/bin/env node

/*
 *
 * 合并，支持从命令行传入压缩参数，也可以在文件中配置压缩参数
 *
 * 命令行使用: 
 * ./concat.js -s 源文件,源文件... -d 目标文件
 * 多个源文件用逗号隔开
 * 
 * 配置项使用：
 * 配置config数组即可，srcPath表示需要压缩的路径(数组)，desPath表示压缩后的文件路径
 *
 * 说明：如果命令行中有带参数，会忽略配置项config的信息，优先从命令行读取数据
 *
 */
 
var fs = require("fs");
var path = require("path");
var argv = require('optimist')
    .alias('s', 'src')
    .alias('d', 'des')
    .argv;

var config = [
    {
        srcPath: ["./a.js", "./b.js"],
        desPath: "ab.js"
    }
];

function concat(srcPath, desPath) {
    srcPath = Array.isArray(srcPath) ? srcPath : [srcPath];
    var fileContent = "";
    for (var i = 0, j = srcPath.length; i < j; i++) {
        var realpath = resolve(srcPath[i]);
        if (fs.existsSync(realpath)) {
            fileContent += fs.readFileSync(realpath, {"encoding": "utf8"}) + "\r\n\r\n";
        }
    }
    
    desPath = resolve(desPath);
    fs.writeFileSync(desPath, fileContent, {"encoding": "utf8"});
    console.log(desPath + " concat success");
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

var srcPath = argv.src,
    desPath = argv.des;

if (process.argv.length > 2) {
    if (!srcPath && !desPath) {
        console.log("目标路径有错误");
        process.exit(1);
    }
    else {
        srcPath = srcPath.split(",");
        concat(srcPath, desPath);
    }
}
else {
    for (var i = 0, j = config.length; i < j; i++) {
        var info = config[i],
            srcPath = info.srcPath,
            desPath = info.desPath;
            
        if (!srcPath && !desPath) {
            console.log("配置路径缺少参数");
            process.exit(1);
        }
        
        concat(srcPath, desPath);
    };
}