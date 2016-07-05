require 'sequel'
require 'colorize'
require 'sinatra'

if settings.development?
  #Development Settings
  require 'rack/contrib/try_static'

  puts 'Running Server in Development'.yellow
  puts 'This exposes a lot of files that SHOULD NOT be exposed! Do not run this in public!'.red
  set :public_folder, File.dirname(__FILE__) + '/app'
  use Rack::TryStatic, :root => '.tmp', :urls => %w[/]
  use Rack::TryStatic, :root => '.', :urls => %w[/]
else
  puts 'Running Server in Production'.yellow
  set :public_folder, File.dirname(__FILE__) + '/dist'
end

get '/' do
  send_file settings.public_folder + '/index.html'
end

get '/api/anon' do
  
end
