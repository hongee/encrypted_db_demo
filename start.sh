#!/bin/bash
#
ln -s /home/vagrant/.sympm/portal/node_modules ./portal/node_modules

tmux new -s server -d "./run-cryptdb.sh"
tmux split-window -v "sleep 1 && ruby server.rb"
tmux split-window -h "cd portal && gulp serve"
tmux split-window
tmux a -t server

#tmux split-window -h -t cryptdb-services "cd portal && gulp serve"
