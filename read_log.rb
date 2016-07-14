#!/usr/bin/env ruby

#
# Script that reads the cryptdb proxy logs from STDIN, parses it and stores it in
# a REDIS db for the main app to consume
#

require 'colorize'
require 'redis'

has_read = false
read_query = ''

redis = Redis.new

while line = gets
  if line.include? ' SET '
    next
  end
  if line.include? 'read_query'
    has_read = true
    read_query = line[12...-1]
  else
    puts "Storing to redis"
    puts "#{read_query}".yellow
    puts "#{line[20...-1]}".blue
    redis.set(read_query, line[20...-1])
    redis.expire(read_query, 600)
    has_read = false
    read_query = ''
  end

end
