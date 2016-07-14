require 'sequel'
require 'colorize'
require 'sinatra'
require 'json'
require 'pry'
require 'logger'
require 'sinatra/json'
require 'redis'
require 'haikunator'

Sequel::Model.plugin :json_serializer
enable :session

if settings.development?
  #Development Settings
  set :bind, '0.0.0.0'
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
else
  puts 'Running Server in Production'.yellow
  set :public_folder, File.dirname(__FILE__) + 'portal/dist'
end

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
end

## Config ##
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

## Routes ##
enable :sessions
set :session_secret, 'hello singtel'

get '/' do
  puts settings.public_folder
  send_file settings.public_folder + '/index.html'
end

## Temporary Table Generation ##
get '/api/temptable' do
  table_name = session[:table_id]
  if(!table_name)
    #table doesn't exist! create the table
    table_name = Haikunator.haikunate
    while TemporaryTables.where(:id => table_name).first
      table_name = Haikunator.haikunate
    end
    table_name = ('temptable-' + table_name).to_sym

    proxyDB.drop_table?(table_name)
    query = "CREATE TABLE `#{table_name}` ( id INT );"
    proxyDB.run(query)

    TemporaryTables.insert(:id => table_name.to_s, :last_touched => DateTime.now)
    proxyDB[table_name].insert(:id => 1)

    session['table_id'] = table_name
    json :data => proxyDB[table_name].all,
         :query => query
  else
    table_name = table_name.to_sym

    #debug
    #proxyDB.run("DROP TABLE IF EXISTS `#{table_name}`")
    #session.clear

    sql = proxyDB[table_name].sql
    json :data => proxyDB.fetch(sql).all,
         :query => sql
  end
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

post '/api/plaintext/taxi/sql' do
  query = params.fetch()

end

post '/api/encrsql' do
  query = params['query']
  encr_query = rewritten_query_store.get(query)
  json :data => encr_query ? encryptDB.fetch(encr_query).all.to_utf8 : nil,
       :query => encr_query
end

get '/api/run' do
  query = params['query']
end
