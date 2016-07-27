#!/bin/bash
#tmux kill-session -t cryptdb-services
tmux new -d "./run-cryptdb.sh"
tmux split-window -v "sleep 1 && ruby server.rb"
tmux split-window -h "cd portal && gulp serve"
tmux split-window
tmux a -t 0

#tmux split-window -h -t cryptdb-services "cd portal && gulp serve"
