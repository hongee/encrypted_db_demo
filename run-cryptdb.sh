#!/bin/bash
export EDBDIR=/home/vagrant/cryptdb

stdbuf -o L /home/vagrant/cryptdb/bins/proxy-bin/bin/mysql-proxy         \
                    --plugins=proxy --event-threads=4             \
                    --max-open-files=1024                         \
                    --proxy-lua-script=$EDBDIR/mysqlproxy/wrapper.lua \
                    --proxy-address=127.0.0.1:3307                \
                    --proxy-backend-addresses=localhost:3306 |

tee >(./read_log.rb) .cryptdb-log > /dev/null
