#!/bin/sh

root_path=/data/vhosts/jinbi.client.xunlei.com/htdocs/
entrance_file=server.js
restart_file=/data/vhosts/jinbi.client.xunlei.com/bin/restart_jinbi_svr.sh
today=`date +%Y-%m-%d`
dbnow=`date '+%Y%m%d%H%M%S'`

cd $root_path

num=`ps -ef | grep node | grep -v "grep" | grep ${root_path}${entrance_file} | wc -l`
if [[ $num -lt 2 ]];then
    echo "${dbnow}----------server.js num:${num}"
    cp uncaughtException.log ./log/uncaughtException.log.$dbnow
    $restart_file
    
    /usr/local/bin/sendEmail -s mail.cc.sandai.net -xu 'monitor@cc.sandai.net' -xp 121212 -f monitor@cc.sandai.net -t fengyajie@cc.sandai.net -cc luzhao@cc.sandai.net -u "jinbi svr down" -m "jinbi svr down @ ${dbnow}"
fi

exit