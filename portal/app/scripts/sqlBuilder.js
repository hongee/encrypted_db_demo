const ValueTypes = {
  COLUMNS: 0,
  TABLES: 1,
  CONDITION: 2,
  JOIN_CONDITION: 3,
  INSERT: 4,
  ADD_COLUMN: 5,
  UNRESTRICTED: 10
}

const ValueNames = {
  '0': '<column1>,<column2>',
  '1': '<table name>',
  '2': 'Condition',
  '3': 'Join Condition',
  '4': '<table name> OR <table name> ( <column1>,<column2>,... )',
  '5': '<column name> <INT | VARCHAR | DATE>', //finish possible types
  '10': 'Values'
}

const Verbs = {
  'SELECT': {
    modifiers: ['FROM','INTO'],
    accepts: ValueTypes.COLUMNS
  },
  'INSERT INTO': {
    modifiers: ['VALUES'],
    accepts: ValueTypes.INSERT
  },
  'UPDATE': {
    modifiers: ['SET'],
    accepts: ValueTypes.TABLES
  },
  'DELETE FROM': {
    modifiers: ['WHERE'],
    accepts: ValueTypes.TABLES
  },
  'ALTER TABLE': {
    modifiers: ['ADD COLUMN', 'DROP COLUMN'],
    accepts: ValueTypes.TABLES
  }
}

const Aggregates = [];

Object.defineProperty(Verbs, 'SELECT DISTINCT', {
  get: function() { return this['SELECT'] }
});

const Modifiers = {
  'AND': {
    modifiers: ['AND', 'OR'],
    accepts: ValueTypes.CONDITION
  },
  'INTO': {
    modifiers: ['FROM', 'ORDER BY'],
    accepts: ValueTypes.TABLES
  },
  'WHERE': {
    modifiers: ['AND', 'OR', 'ORDER BY'],
    accepts: ValueTypes.CONDITION
  },
  'JOIN': {
    modifiers: ['ON', 'ORDER BY'],
    accepts: ValueTypes.TABLES
  },
  'ON': {
    modifiers: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'ORDER BY'],
    accepts: ValueTypes.JOIN_CONDITION
  },
  'FROM': {
    modifiers: ['WHERE' ,'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'ORDER BY'],
    accepts: ValueTypes.TABLES
  },
  'ORDER BY': {
    modifiers: [],
    accepts: ValueTypes.COLUMNS
  },
  'SET': {
    modifiers: ['WHERE'],
    accepts: ValueTypes.UNRESTRICTED
  },
  'VALUES': {
    modifiers: [],
    accepts: ValueTypes.UNRESTRICTED
  },
  'ADD COLUMN': {
    modifiers: [],
    accepts: ValueTypes.ADD_COLUMN
  },
  'DROP COLUMN': {
    modifiers: [],
    accepts: ValueTypes.COLUMNS
  }
}

Modifiers['FROM'].modifiers.forEach(function(term) {
  if(term.includes('JOIN')) {
    Object.defineProperty(Modifiers, term, {
      get: function() { return this['JOIN'] }
    });
  }
});

var AutoComplete = [];


//TODO: Refactor this
class Query {
  constructor(verb) {
    this.verb = verb ? verb : 'SELECT';
    this.verbValue = '';
    this.modifiers = [''];
    this.values = [''];
    this.setVerb(this.verb);
  }

  allowedModifiers(index) {
    if(index == 0) {
      return Verbs[this.verb].modifiers;
    } else {
      return Modifiers[this.modifiers[index-1]].modifiers;
    }
  }

  setVerb(verb) {
    this.verb = verb;
    this.verbValue = '';
    this.modifiers = [Verbs[verb].modifiers[0]];
    this.values = [''];
  }

  setModifier(modifier, index) {
    //drop every modifier after current
    this.modifiers[index] = modifier;
    this.modifiers.splice(index+1, this.modifiers.length - index);
    this.values.splice(index+1, this.modifiers.length - index);
    var nextModifier = Modifiers[modifier].modifiers[0];
    if(nextModifier) {
      this.modifiers.push(nextModifier);
      this.values.push('');
    }
  }

  doInsertModifier(index, modifier) {
    if(index == (this.modifiers.length-1)) {
      var nextModifier = Modifiers[modifier].modifiers[0];
      if(nextModifier) {
        this.modifiers.push(nextModifier);
        this.values.push('');
      }
    }
  }

  static accepts(type, term) {
    if(Modifiers[term]) {
      return Modifiers[term].accepts == type;
    } else {
      return Verbs[term].accepts == type;
    }
  }

  static cleanInputStrings(s, modifier) {
    var words = s.split(' ');
    var keyWords = ['*', 'VARCHAR', 'INT'];
    var skipModifiers = ['ADD COLUMN', 'VALUES', 'ON', 'WHERE', 'AND', 'OR'];

    if(skipModifiers.includes(modifier)) {
      return ' ' + words.join(' ') + ' ';
    }

    console.log(modifier);

    words = words.map((w) => {
      if(keyWords.some((kw) => w.includes(kw)))
        return w;
      else if(modifier == 'SELECT' && w.includes('('))
        return w.replace(/\((.+)\)/, '(`$1`)')
      else
        return '`' + w + '`';
    });

    console.log(words.join(' '));

    return ' ' + words.join(' ') + ' ';
  }

  static updateAutocomplete() {
    var tables = this.$parent.tables;
    Vue.nextTick(() => {
      var tableInputs = $('input[data-form-type="' + ValueTypes.TABLES + '"], input[data-form-type="' + ValueTypes.INSERT + '"]');
      console.log(tableInputs);
      if(tableInputs) {
        tableInputs.each((i,v) => {
          $(v).typeahead({
            source: tables,
          });
        });
      }
    });

  }

}

var QueryBuilder = Vue.extend({
  template: `
  <div class="col-md-6" id="query-builder">
    <span class="section-header header left">QUERY BUILDER</span>
    <div class="input-group query-builder-input">
      <div class="input-group-btn plain-sql">
        <button class="btn btn-default dropdown-toggle action" type="button" data-toggle="dropdown" >
          {{{currentQuery.verb | syntax}}}
          <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" >
          <li v-for="v in Verbs"><a href="javascript:void(0);" v-on:click="currentQuery.setVerb($key)">{{{$key | syntax}}}</a></li>
        </ul>
      </div>
      <input v-for="t in ValueTypes" type="text" data-form-type="{{t}}" class="form-control" placeholder="{{t | type-to-string}}" v-if="accepts(t,currentQuery.verb)" v-model="currentQuery.verbValue">
    </div>
    <div class="input-group query-builder-input" v-for="modifier in currentQuery.modifiers" track-by="$index">
      <div class="input-group-btn plain-sql">
        <button class="btn btn-default dropdown-toggle action" type="button" data-toggle="dropdown" >
          <span class="hljs-keyword">{{{modifier | syntax}}}</span>
          <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" >
          <li v-for="m in currentQuery.allowedModifiers($index)"><a href="javascript:void(0);" v-on:click="currentQuery.setModifier(m, $parent.$index)"><span class="hljs-keyword">{{{m | syntax}}}</span></a></li>
        </ul>
      </div>
      <input v-for="t in ValueTypes" type="text" data-form-type="{{t}}" class="form-control" placeholder="{{t | type-to-string}}" v-on:click="currentQuery.doInsertModifier($parent.$index, modifier)" v-if="accepts(t,modifier)" v-model="currentQuery.values[$parent.$index]">
    </div>
    <button class="btn btn-default" v-on:click="submit"><i class="fa fa-play" aria-hidden="true"></i></button>
  </div>
  `,
  created: function() {
    var queries = localStorage.getItem('saved_queries');
    if(!queries) {
      this.newQuery();
    } else {
      this.queries = queries;
      this.index = 0;
    }
  },
  data: function() {
    return {
      queries: [],
      index: -1,
      Verbs: Verbs,
      Modifiers: Modifiers,
      ValueTypes: ValueTypes
    }
  },
  computed: {
    currentQuery: function() {
      var i = this.index;
      if(i == -1)
        return {};
      else
        return this.queries[i];
    }

  },
  watch: {
    'currentQuery.modifiers': Query.updateAutocomplete,
    'currentQuery.verb': Query.updateAutocomplete
  },
  methods: {
    accepts: Query.accepts,
    newQuery: function() {
      this.queries.push(new Query());
      this.index += 1;
    },
    submit: function() {
      console.log(this);
      //WARNING: THIS ENDPOINT ASSUMES A NON PUBLIC FACING WEBSITE
      //EXTREMELY DANGEROUS TO DEPLOY THIS IN THE WILD
      //EVEN WITH AN ENCRYPTED DATABASE
      if(this.currentQuery.verbValue.length == 0) {
        console.log('Incomplete SQL query!');
        return;
      }

      var sqlString = this.currentQuery.verb + Query.cleanInputStrings(this.currentQuery.verbValue, this.currentQuery.verb);

      this.currentQuery.modifiers.forEach((val, index) => {
        if(this.currentQuery.values[index].length == 0) {
          if(index != (this.currentQuery.modifiers.length-1) || index == 0) {
            console.log('Incomplete SQL query!');
          }
          return;
        } else {
          sqlString += val + Query.cleanInputStrings(this.currentQuery.values[index], val);
        }
      });

      sqlString += ';';
      this.$parent.runSql(sqlString);
    }
  }
});

Vue.component('query-builder', QueryBuilder);
Vue.filter('type-to-string', function(value) {
  return ValueNames[value];
});
