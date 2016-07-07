#!/usr/bin/env ruby
##
# Script that loads data into MySQL
# ===
# CryptDB doesn't seem to support LOAD, so this takes a while

require 'colorize'
require 'csv'
require 'mysql'
require 'sequel'
require 'ruby-progressbar'
require 'logger'

#Set row buffer size
row_buffer_size = 500
row_buffer = []
row_index = 0

#CSV::Converters[:blank_to_nil] = lambda do |field|
#  field && field.empty? ? nil : field
#end

if ARGV[0].nil?
  puts 'Error! Missing argument for data files directory.'.red
  abort
end

directory = ARGV[0]

DB = Sequel.connect('mysql://root:letmein@localhost:3307/testdb')

file_name_prefixes = ARGV.drop(1)

file_name_prefixes.each do |prefix|
  puts "Reading files with prefix #{prefix}...".yellow
  #Creating the table if it doesn't already exist
  headers = []
  row = []
  File.open(directory + '/' + prefix + '_1.csv') do |f|
    2.times do |i|
      if i == 0
        h = CSV.parse_line(f.gets)
        headers = h.map { |e| e.to_sym }
      else
        row = CSV.parse_line(f.gets, :converters => :all)
      end
    end
  end

  DB.create_table?(prefix.to_sym) do
    row.each_with_index do |r,i|
      send(r.class.to_s, headers[i])
    end
  end

  puts "Parsing #{prefix + '_1.csv'}...".green

  number_of_rows = %x{wc -l #{directory + '/' + prefix + '_1.csv'}}.to_i
  progressbar = ProgressBar.create(:title => "Rows", :total => number_of_rows)

  CSV.foreach(directory + '/' + prefix + '_1.csv', :headers => true, :header_converters => :symbol, :converters => :all) do |row|
    row_buffer.push(row.to_hash)
    row_index+=1
    if row_index == row_buffer_size
      DB[prefix.to_sym].multi_insert(row_buffer)
      row_buffer.clear
      row_index = 0
      progressbar.log("#{$.} of #{number_of_rows}")
    end
    progressbar.increment
  end
end
