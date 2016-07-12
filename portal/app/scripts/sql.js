var encrSqlHistory = {
  index: -1,
  data: [],
  showEncr: false
};

function getEncrSql(sql) {
  var defer = $.Deferred();

  var keepCalling = function(){
    $.post('/api/encrsql', { query: sql })
     .then(function (res) {
        console.log(res);
        if(!res.data) {
          console.log("no data received. repolling in 100ms...");
          setTimeout(keepCalling, 100);
        } else {
          defer.resolve(res);
        }
    });
  };

  keepCalling();

  return defer.promise();
}

function executeSql(e) {
  var apiString = '';
  var params = {};

  if("target" in e) {
    //is a button
    var $el = $(e.target);
    var set = $el.data('data-set');
    var table = $el.data('data-table')
    var q = $el.data('data-query');

    params.selector = $el.html().trim();
    params.column = $el.data('data-col');

    apiString = '/api/' + set + '/' + table + '/' + q;
  } else {
    apiString = e;
  }

  var newEntry = {};
  var index = 0;

  $.get(apiString,params)
  .then(function(res){
    console.log(res);

    newEntry.plainSql = hljs.highlightAuto(res.query).value;
    newEntry.encrSql = "...";
    newEntry.data = res.data;

    index = encrQuerySection.data.length;
    encrQuerySection.data.push(newEntry);
    encrQuerySection.index = index;

    //Vue.nextTick(() => {
    //  hljs.highlightBlock($('.plain-sql')[0]);
    //});

    return getEncrSql(res.query);
  })
  .then(function(res) {
    //encrSqlBox.html(res);
    encrQuerySection.data[index].encrSql = hljs.highlightAuto(res.query).value;
    encrQuerySection.data[index].encrData = res.data;
    //Vue.nextTick(() => {
    //  hljs.highlightBlock($('.encr-sql')[0]);
    //});
  });

};

var encrQuerySection = new Vue({
  el: '#encr-section',
  data: encrSqlHistory,
  computed: {
    currentData: function() {
      var i = this.index;
      return this.data[i];
    },
    currentHeaders: function() {
      return Object.keys(this.data[this.index].data[0]);
    }
  },
  methods: {
    switchDataset: function() {
      if(this.showEncr) {
        //already displaying encrypted data
        this.showEncr = false;
        this.data[this.index].data = this.temp;
      } else {
        this.showEncr = true;
        this.temp = this.data[this.index].data
        this.data[this.index].data = this.data[this.index].encrData
      }
    },
    runSql: executeSql,
    next: function() {
      this.showEncr = false;
      if(this.index < this.data.length-1)
        this.index += 1;
      else
        this.index = 0;
    },
    prev: function() {
      this.showEncr = false;
      if(this.index > 0)
        this.index -= 1;
      else {
        this.index = this.data.length-1
      }
    }

  }
});
