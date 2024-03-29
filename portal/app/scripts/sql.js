const SqlButtons = {
  'All Taxi Data': 'SELECT * FROM `trip_data` LIMIT 10 OFFSET 0;',
  'Longest Rides': 'SELECT `medallion`, `trip_time_in_secs`, `trip_distance` FROM `trip_data` ORDER BY `trip_time_in_secs` DESC LIMIT 10 OFFSET 0;',
  'Unique Taxi Drivers': 'SELECT COUNT(DISTINCT(`medallion`)) FROM `trip_data`;',
  'Average Passenger Count': 'SELECT SUM(`passenger_count`), COUNT(*) FROM `trip_data`;',
  'Trips with Ratings > 1': 'SELECT `medallion`, `trip_time_in_secs`, `trip_distance`, `rate_code`, `passenger_count` FROM `trip_data` WHERE `rate_code`>1 ORDER BY `rate_code` DESC LIMIT 10 OFFSET 0;',
  'Pick Ups in Manhattan': 'SELECT `medallion`, `pickup_longitude`, `pickup_latitude`, `trip_time_in_secs`, `trip_distance` FROM `trip_data` WHERE `pickup_latitude` > 40748000 AND'+
                                             '`pickup_latitude` < 40749000;'
}

class Entry {
  constructor(plainSql, data) {
    this.plainSql = hljs.highlightAuto(plainSql).value;
    this.data = data ? data : [];
    this.encrSql = '';
    this.encrData = [];

    getEncrSql(plainSql)
      .then((res) => {
         this.encrData = res.data;
         this.encrSql = hljs.highlightAuto(res.query).value;
      });
  }
}

function shouldShowPlaceholder() {
  return (this.index == -1) || (this.data && !this.data[this.index].data.length);
}

function getEncrSql(sql) {
  var defer = $.Deferred();

  var keepCalling = function(){
    $.post('/api/encrsql', { query: sql })
     .then(function (res) {
        console.log(res);
        if(!res.query) {
          console.log('no data received. repolling in 100ms...');
          setTimeout(keepCalling, 100);
        } else {
          defer.resolve(res);
        }
    });
  };

  keepCalling();

  return defer.promise();
}

function executeSql(e, isButton) {
  var apiString = '/api/raw_query';
  var params = {};
  var method = 'POST';

  var view = this;

  if(isButton) {
    //is a button
    params.query = SqlButtons[e];
    apiString = '/api/taxi';
  } else {
    params.query = e;
  }

  var newEntry = {};
  var index = 0;
  $.ajax(apiString, {
    method: method,
    data: params
  })
  .then(function(res){
    console.log(res);

    view.data.push(new Entry(res.query, res.data));
    view.index += 1;
  })
  .catch(function(err) {
    console.log(err);
    alert(err.responseText);
  });
};

function currentData() {
  var i = this.index;
  if(i == -1)
    return {};
  else
    return this.data[i];
}

function currentHeaders() {
  if (!this.data[this.index] || !this.data[this.index].data[0])
    return {};
  else
    return Object.keys(this.data[this.index].data[0]);
}

function toggleEncrData() {
  if(!this.data[this.index].encrData)
    return;
  if(this.showEncr) {
    //already displaying encrypted data
    this.showEncr = false;
    this.data[this.index].data = this.temp;
  } else {
    this.showEncr = true;
    this.temp = this.data[this.index].data
    this.data[this.index].data = this.data[this.index].encrData
  }
}

function nextInQueryHistory() {
  if(this.index == -1) return;
  this.showEncr = false;
  if(this.index < (this.data.length-1))
    this.index += 1;
  else
    this.index = 0;
}

function previousInQueryHistory() {
  if(this.index == -1) return;
  this.showEncr = false;
  if(this.index > 0)
    this.index -= 1;
  else {
    this.index = this.data.length-1
  }
}

var sandboxSection = new Vue({
  el: '#temp-db-sandbox',
  data: {
    tables: [],
    loading: false,
    data: [],
    spinner: null,
    tableIndex: 0,
    index: -1
  },
  computed: {
    shouldShowInfo: function() {
      return !this.loading && !this.tables[0];
    },
    shouldShowMain: function() {
      return !this.loading && (this.tables.length != 0);
    },
    shouldShowPlaceholder: shouldShowPlaceholder,
    currentData: currentData,
    currentHeaders: currentHeaders
  },
  methods: {
    startLoad: function() {
      this.spinner = new Spinner(spinnerOpts).spin(this.$el);
      this.loading = true;
    },
    endLoad: function() {
      this.loading = false;
      this.spinner.stop();
    },
    init: function() {
      this.startLoad();
      $.get('/api/temptable')
       .then(function(res) {
         sandboxSection.tables = res.tables;
         sandboxSection.endLoad();

         sandboxSection.data.push(new Entry(res.query, res.data))
         sandboxSection.index += 1;
       })
    },
    newSandbox: function() {
      this.startLoad();
      $.get('/api/temptable', {new: true})
       .then(function(res) {
         console.log(res);
         sandboxSection.tables = res.tables;
         sandboxSection.endLoad();

         sandboxSection.data.push(new Entry(res.query, res.data))
         sandboxSection.index += 1;
       });
    },
    switchSandbox: function(i) {
      $.get('/api/temptable', {index: i})
       .then(function(res) {
         sandboxSection.tables = res.tables;

         sandboxSection.data.push(new Entry(res.query, res.data))
         sandboxSection.index += 1;
         sandboxSection.tableIndex = i;
       })
    },
    dropSandbox: function(i) {
      this.startLoad();
      $.ajax({
        url: '/api/temptable',
        type: 'DELETE',
        data: {index: i}
      })
       .then(function(res) {
         console.log(res);
         sandboxSection.tables = res.tables;
         sandboxSection.tableIndex = (i - 1) >= 0 ? (i-1) : 0;
         sandboxSection.endLoad();

         sandboxSection.data.push(new Entry(res.query, res.data));
         sandboxSection.index += 1;
       });
    },
    switchDataset: toggleEncrData,
    runSql: executeSql,
    next: nextInQueryHistory,
    prev: previousInQueryHistory
  }
})

var encrQuerySection = new Vue({
  el: '#general-encr-queries',
  data: {
    index: -1,
    data: [],
    showEncr: false,
    buttons: SqlButtons
  },
  computed: {
    currentData: currentData,
    currentHeaders: currentHeaders,
    shouldShowPlaceholder: shouldShowPlaceholder
  },
  methods: {
    switchDataset: toggleEncrData,
    runSql: executeSql,
    next: nextInQueryHistory,
    prev: previousInQueryHistory

  }
});
