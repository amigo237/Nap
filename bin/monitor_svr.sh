#!/bin/sh

today=`date +%Y-%m-%d`
dbnow=`date '+%Y%m%d%H%M%S'`

start_time=`date`
#echo ${start_time}

cd /data/vhosts/jinbi.xunlei.com/htdocs/

num=`ps -ef | grep node | grep -v "grep" | grep /data/vhosts/jinbi.xunlei.com/htdocs/server.js | wc -l`
if [[ $num -lt 2 ]];then
    echo "${dbnow}----------server.js num:${num}"
    cp jinbi.log ./log/jinbi.log.$dbnow
    /data/vhosts/jinbi.xunlei.com/bin/restart_jinbi_svr.sh
    
    #send warn email
fi
end_time=`date`
#echo ${end_time}
exit