server {
    listen       80;
    server_name  support.client.xunlei.com;
    root /data/vhosts/support.client.xunlei.com/htdocs;
    #access_log  logs/access.support.client.xunlei.com.log;
    #error_log logs/error.support.client.xunlei.com.log;

    set $my_real_uri $uri;
    
    #如果是目录
    if ($uri ~ (.*)\/$) {
        set $my_real_uri "${uri}index.html";
    }

    if (-f $document_root/static/$my_real_uri) {
        rewrite  ^(.*)$  /static/$my_real_uri  last;
    }
    
    location = /favicon.ico {
        root /data/vhosts/support.client.xunlei.com/htdocs;
        expires 90d;
    }
    
    location ^~ /static/ {
        if ($uri ~ \.(gif|jpg|jpeg|png|ico|css|js|txt|flv|swf|doc|ppt|xls|pdf)\??.*) {
            expires 15d;
            #add_header Cache-Control max-age=2592000;
        }
        root /data/vhosts/support.client.xunlei.com/htdocs;
    }

    location ^~ /doc/ {
        root /data/vhosts/support.client.xunlei.com/htdocs;
    }
    
    location / {
        proxy_buffering  off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_pass       http://127.0.0.1:9511;
        root             /data/vhosts/support.client.xunlei.com/htdocs;
        index            index.php index.html index.htm;
    }

    location ~ \.php$ {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  /data/vhosts/jinbi.client.xunlei.com/htdocs/$fastcgi_script_name;
        include        fastcgi_params;
    }
}