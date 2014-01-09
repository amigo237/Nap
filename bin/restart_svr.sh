#!/bin/sh

today=`date +%Y-%m-%d`
dbnow=`date '+%Y%m%d%H%M%S'`

export NODE_PATH=/usr/local/lib/node_modules

start_time=`date`
#echo ${start_time}

cd /data/vhosts/jinbi.xunlei.com/htdocs/
ps -ef | grep /data/vhosts/jinbi.xunlei.com/htdocs/server.js | grep -v grep | awk '{print ($3 == 1 ? $2 : "")}' | xargs kill -9
/usr/local/bin/node /data/vhosts/jinbi.xunlei.com/htdocs/server.js > jinbi.log 2>&1 &

end_time=`date`
#echo ${end_time}
exit
