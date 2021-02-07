#!/bin/bash

## INSTALL NODE if needed
if which node > /dev/null
then
    echo '';
else
    echo -e "Installing node.IO ...";
    curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
    sudo apt -y install nodejs npm;
fi

###RUN ON PORT 3000
node index.js -r . -p 3000 --oc 1

###RUN ON PORT 80 + 443 with AutoSSL
#node index.js -r . --oc 1 -p 80 --ssl --sslport 443 --ssldomain www.yourdomain.com
