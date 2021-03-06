#!/usr/bin/env node

/*
 *
 * 利用uglify压缩文件，支持从命令行传入压缩参数，也可以在文件中配置压缩参数
 *
 * 命令行使用: 
 * 1. ./compress.js -s 源文件 -d 目标文件
 * 2. ./compress.js -s 源文件 -d 目标路径, 这种方式会沿用未压缩文件的文件名
 * 3. ./compress.js -s 源目录 -d 目标目录 --deep, --deep参数表示递归目录压缩，没有该选项表示只压缩一层目录
 * 
 * 配置项使用：
 * 配置config数组即可，srcPath表示需要压缩的路径，desPath表示压缩后的文件路径，deep表示递归压缩
 * 具体使用形式也是有三种形式，和命令行使用相同。
 *
 * 说明：如果命令行中有带相应路径参数，会忽略配置项config的信息，优先从命令行读取数据
 *
 */

var fs = require("fs");
var path = require("path");
var uglify = require("uglify-js");
var argv = require('optimist')
    .alias('s', 'src')
    .alias('d', 'des')
    .argv;

var config = [
    {        
        srcPath: "a.js",
        desPath: "a-min.js",
        deep: false
    }
];

function compress(srcPath, desPath, deep) {
    srcPath = resolve(srcPath);
    desPath = resolve(desPath);
    var stat = fs.lstatSync(srcPath);
    if (stat) {
        
        //源路径是一个目录，递归压缩
        if (stat.isDirectory() && compress.deepNum < 1) {
            if (!fs.existsSync(desPath)) {
                fs.mkdirSync(desPath);
            }

            !deep && (compress.deepNum = compress.deepNum + 1);
            var files = fs.readdirSync(srcPath);
            for (var i = 0, j = files.length; i < j; i++) {
                compress(srcPath + "/" + files[i], desPath + "/" + files[i], deep);
            }
        }
        else if (stat.isFile()) {
            var result = uglify.minify(srcPath),
                desStat;

            //如果目标路径是文件目录，直接用以前的文件名。如果目标路径是文件这里会报错，因为文件还不存在，所以加个try吧
            try {
                desStat = fs.lstatSync(desPath);
                if (desStat.isDirectory()) {
                    desPath = desPath + path.basename(srcPath);
                }
            }
            catch(e) {
                //todo
            }
            
            fs.writeFileSync(desPath, result.code, {"encoding": "utf8"});
            console.log(desPath + " compress success");
        }
    }
};
compress.deepNum = 0; //表示递归了几次，如果没有递归压缩选项，只压缩第一层目录

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
    desPath = argv.des,
    deep = argv.deep;

if (process.argv.length > 2) {
    if (!srcPath && !desPath) {
        console.log("传入路径有误");
        process.exit(1);
    }
    else {
        compress(srcPath, desPath, deep);
    }
}
else {
    for (var i = 0, j = config.length; i < j; i++) {
        var info = config[i],
            srcPath = info.srcPath,
            desPath = info.desPath,
            deep = !!info.deep;
            
        if (!srcPath && !desPath) {
            console.log("配置路径缺少参数");
            process.exit(1);
        }
        
        compress(srcPath, desPath, deep);
    };   
}