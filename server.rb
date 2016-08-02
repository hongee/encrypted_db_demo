#!/usr/bin/env ruby
##
# Script for the Application Server
# By default serves the current development temp directory at port 4567
# Possible Arguments
# - 'init' - attempts to automatically grab front end dependencies if this is a fresh clone
#            however rather unreliable - manual setup is better
# - 'live' - use when deploying on production/public/whatever. builds and minimizes the front end
#

require 'sequel'
require 'colorize'
require 'sinatra'
require 'json'
require 'pry'
require 'logger'
require 'sinatra/json'
require 'redis'
require 'haikunator'
require 'active_support/all'

Sequel::Model.plugin :json_serializer
enable :session

#By default Sinatra binds to the loopback address
set :bind, '0.0.0.0'

if ARGV[0] != 'live'
  #Development Settings
  if ARGV[0] == 'init'
    puts 'Setting up Web Dependencies'.yellow
    Dir.chdir("portal") do
      `npm install`
      `npm install bower`
      `bower install`
      `gulp serve`
      `gulp build`
    end
  end

  require 'rack/contrib/try_static'

  puts 'Running Server in Development'.yellow
  puts 'This exposes a lot of files that SHOULD NOT be exposed! Do not run this in public!'.red
  set :public_folder, File.dirname(__FILE__) + '/portal/app'
  use Rack::TryStatic, :root => 'portal/.tmp', :urls => %w[/]
  use Rack::TryStatic, :root => 'portal', :urls => %w[/]
end

## Config ##
VERY_SECURE_SECRET = "hello singtel"

encryptDB = Sequel.mysql2('testdb', :user => 'root', :password => 'letmein', :host => 'localhost', :encoding => 'latin1')
proxyDB = Sequel.connect('mysql2://root:letmein@127.0.0.1:3307/testdb')

rewritten_query_store = Redis.new

known_tables_json = File.read("./known_tables.json")
known_tables = JSON.parse(known_tables_json)['tables']

trip_data_encr = known_tables['trip_data'].to_sym

num_values = 10

proxyDB.create_table?(:temporary_tables) do
  String :id, :primary_key=>true
  Datetime :last_touched
end

TemporaryTables = proxyDB[:temporary_tables]
####

## Helper Functions ##
# Helper function to correctly encode the crappy ASCII-8 encoded stuff
class Array
  def to_utf8
    self.collect do |v|
      Hash[
        v.collect do |k,v|
          if v.is_a? String
            [k,v.force_encoding("ISO-8859-1").encode('utf-8')]
          else
            [k,v]
          end
        end
      ]
    end
  end

  def el_to_s
    self.collect do |v|
      if v.is_a? Symbol
        v.to_s
      else
        v
      end
    end
  end
end



####

## Routes ##
enable :sessions
set :session_secret, VERY_SECURE_SECRET

get '/' do
  puts settings.public_folder
  send_file settings.public_folder + '/index.html'
end

## Temporary Table Generation ##

# @param
# secret - String - drops all tables if provided
# debug - Bool - sets the time threshold when dropping all
# index - Int - index of the table in the `tables` array to drop
delete '/api/temptable' do
  #cleans up all unused databases
  deleted = []
  ttl = params['debug'] ? 5.seconds.ago : 6.hours.ago

  if params['secret'] == VERY_SECURE_SECRET
    proxyDB.transaction do
      TemporaryTables.all do |row|
        if row[:last_touched] < ttl
          puts "Deleting #{row[:id]}..."
          deleted.push(row)
          proxyDB.drop_table?(row[:id])
        end
      end
      deleted_ids = deleted.map do |el|
        el[:id]
      end
      TemporaryTables.where(:id => deleted_ids).delete
    end
  else
    tables = session[:tables]
    delete_index = params['index'].to_i
    delete_id = tables[delete_index]
    sql = "DROP TABLE IF EXISTS `#{delete_id}`;"
    to_delete = TemporaryTables.where(:id => delete_id.to_s)

    proxyDB.transaction do
      deleted.push(to_delete.first)
      tables.delete_at(delete_index)

      proxyDB.run(sql)

      session['tables'] = tables
      to_delete.delete
    end
  end

  json :debug => !params['debug'].nil?,
       :data => params['debug'] ? deleted : [],
       :tables => tables,
       :query => sql
end

# @param
# new - Bool - creates a new table
# index - Int - chooses which table in the array to show
get '/api/temptable' do
  tables = session[:tables].nil? ? [] : session[:tables]
  if params['new']
    #table doesn't exist! create the table
    table_name = Haikunator.haikunate
    while TemporaryTables.where(:id => table_name).first
      table_name = Haikunator.haikunate
    end
    table_name = (table_name).to_sym
    proxyDB.drop_table?(table_name)

    query = "CREATE TABLE `#{table_name}` ( id INT );"
    proxyDB.run(query)

    TemporaryTables.insert(:id => table_name.to_s, :last_touched => DateTime.now)
    proxyDB[table_name].insert(:id => 1)

    session['tables'] = tables.push(table_name)
    json :data => nil,#proxyDB[table_name].all,
         :query => query,
         :tables => tables
  elsif tables.empty?
    json :data => nil,
         :tables => []
  else
    index = params['index'].to_i
    sql = proxyDB[tables[index]].sql
    TemporaryTables.where(:id => tables.el_to_s).update(:last_touched => DateTime.now)
    begin
      data = proxyDB.fetch(sql).all
    rescue
      session[:tables] = nil
      json :data => nil,
           :tables => []
    else
      json :data => data,
           :query => sql,
           :tables => tables,
           :index => index
    end
  end
end

post '/api/raw_query' do
  sql = params.fetch('query')
  puts "#{sql}"

  begin
    if(sql.include? 'ALTER')
      data = proxyDB.run(sql)
    else
      data = proxyDB.fetch(sql).all
    end
  rescue => e
    puts e
    if e.to_s.include? 'syntax'
      halt 400, 'SQL Syntax Error'
    else
      halt 400, "Error! #{e.to_s}"
    end
    raise e
  else
    json :data => data,
         :query => sql
  end
end

post '/api/taxi' do
  sql = params.fetch('query')
  puts "#{sql}"

  #fixes the floating point numbers
  data = proxyDB.fetch(sql).all.map do |e|
    Hash[
      e.map do |k,v|
        begin
          int_val = Integer(v, 10)
        rescue
          [k,v]
        else
          if int_val > 10000 || int_val < -10000
            [k,int_val/1000000.0]
          else
            [k,v]
          end
        end
      end
    ]
  end

  json :data => data,
       :query => sql
end

get '/api/plaintext/taxi/:what' do
  page = params.fetch('page', 1).to_i
  what = params.fetch('what', 'all')
  if what == 'all'
    sql = proxyDB[:trip_data].limit(num_values).offset((page-1) * num_values).sql
  elsif what == 'longest'
    selector = params.fetch('column', 'trip_time_in_secs').to_sym
    sql = proxyDB[:trip_data].reverse_order(selector).select(:medallion, :trip_time_in_secs, :trip_distance).limit(num_values).offset((page-1) * num_values).sql
  elsif what == 'select'
    selector = params.fetch('selector', '')
    column = params.fetch('column', '').to_sym
    sql = proxyDB[:trip_data].where(column => selector).limit(num_values).offset((page-1) * num_values).sql
  end

  puts "#{sql}".green
  json :data => proxyDB.fetch(sql).all,
       :query => sql
  #avg(:trip_time_in_secs)
end

post '/api/encrsql' do
  query = params['query']
  begin
    encr_query = rewritten_query_store.get(query)
  rescue
    halt 400, 'Something went wrong while fetching the encrypted query :('
  else
    if query.include?('SELECT') && !encr_query.include?('cryptdb_agg')
      data = encr_query ? encryptDB.fetch(encr_query).all.to_utf8 : nil
    else
      data = nil
    end
  end
  json :data => data,
       :query => encr_query
end

get '/api/run' do
  query = params['query']
end
