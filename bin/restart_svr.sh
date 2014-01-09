#!/bin/sh

node_path=/usr/local/bin/node
root_path=/data/vhosts/jinbi.client.xunlei.com/htdocs/
entrance_file=server.js
today=`date +%Y-%m-%d`
dbnow=`date '+%Y%m%d%H%M%S'`

export NODE_PATH=/usr/local/lib/node_modules

cd $root_path
ps -ef | grep ${root_path}${entrance_file} | grep -v grep | awk '{print ($3 == 1 ? $2 : "")}' | xargs kill -9
$node_path ${root_path}${entrance_file} > uncaughtException.log 2>&1 &

exit
