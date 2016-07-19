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
  "0": "<column1>,<column2>",
  "1": "<table name>",
  "2": "Condition",
  "3": "Join Condition",
  "4": "<table name> OR <table name> ( <column1>,<column2>,... )",
  "5": "<column name> <INT | VARCHAR | DATE>", //finish possible types
  "10": "Values"
}

const Verbs = {
  "SELECT": {
    modifiers: ["INTO", "FROM"],
    accepts: ValueTypes.COLUMNS
  },
  "INSERT INTO": {
    modifiers: ["VALUES"],
    accepts: ValueTypes.INSERT
  },
  "UPDATE": {
    modifiers: ["SET"],
    accepts: ValueTypes.TABLES
  },
  "DELETE FROM": {
    modifiers: ["WHERE"],
    accepts: ValueTypes.TABLES
  },
  "ALTER TABLE": {
    modifiers: ["ADD", "DROP COLUMN"],
    accepts: ValueTypes.TABLES
  }
}

const Aggregates = [];

Object.defineProperty(Verbs, "SELECT DISTINCT", {
  get: function() { return this["SELECT"] }
});

const Modifiers = {
  "INTO": {
    modifiers: ["FROM", "ORDER BY"],
    accepts: ValueTypes.TABLES
  },
  "WHERE": {
    modifiers: ["AND", "OR", "ORDER BY"],
    accepts: ValueTypes.CONDITION
  },
  "JOIN": {
    modifiers: ["ON", "ORDER BY"],
    accepts: ValueTypes.TABLES
  },
  "ON": {
    modifiers: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "ORDER BY"],
    accepts: ValueTypes.JOIN_CONDITION
  },
  "FROM": {
    modifiers: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "ORDER BY"],
    accepts: ValueTypes.TABLES
  },
  "ORDER BY": {
    modifiers: [],
    accepts: ValueTypes.COLUMNS
  },
  "SET": {
    modifiers: ["WHERE"],
    accepts: ValueTypes.UNRESTRICTED
  },
  "VALUES": {
    modifiers: [],
    accepts: ValueTypes.UNRESTRICTED
  },
  "ADD": {
    modifiers: [],
    accepts: ValueTypes.ADD_COLUMN
  },
  "DROP COLUMN": {
    modifiers: [],
    accepts: ValueTypes.COLUMNS
  }
}

Modifiers["FROM"].modifiers.forEach(function(term) {
  if(term.includes("JOIN")) {
    Object.defineProperty(Modifiers, term, {
      get: function() { return this["JOIN"] }
    });
  }
});

var AutoComplete = [];


//TODO: Refactor this
class Query {
  constructor(verb) {
    this.verb = verb ? verb : "SELECT";
    this.verbValue = "";
    this.modifiers = [""];
    this.values = [""]
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
    this.modifiers = [Verbs[verb].modifiers[0]];
    this.values = [""];
  }

  setModifier(modifier, index) {
    //drop every modifier after current
    this.modifiers[index] = modifier;
    this.modifiers.splice(index+1, this.modifiers.length - index);
    this.values.splice(index+1, this.modifiers.length - index);
    var nextModifier = Modifiers[modifier].modifiers[0];
    if(nextModifier) {
      this.modifiers.push(nextModifier);
      this.values.push("");
    }
  }

  static accepts(type, term) {
    if(Modifiers[term]) {
      return Modifiers[term].accepts == type;
    } else {
      return Verbs[term].accepts == type;
    }
  }

}

var QueryBuilder = Vue.extend({
  template: `
  <div class="col-md-6" id="query-builder" >
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
      <input v-for="t in ValueTypes" type="text" class="form-control" placeholder="{{t | type-to-string}}" v-if="accepts(t,currentQuery.verb)">
    </div>
    <div class="input-group query-builder-input" v-for="modifier in currentQuery.modifiers">
      <div class="input-group-btn plain-sql">
        <button class="btn btn-default dropdown-toggle action" type="button" data-toggle="dropdown" >
          <span class="hljs-keyword">{{{modifier | syntax}}}</span>
          <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" >
          <li v-for="m in currentQuery.allowedModifiers($index)"><a href="javascript:void(0);" v-on:click="currentQuery.setModifier(m, $parent.$index)"><span class="hljs-keyword">{{{m | syntax}}}</span></a></li>
        </ul>
      </div>
      <input v-for="t in ValueTypes" type="text" class="form-control" placeholder="{{t | type-to-string}}" v-if="accepts(t,modifier)">
    </div>
  </div>
  `,
  created: function() {
    var queries = localStorage.getItem("saved_queries");
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
    },

  },
  methods: {
    accepts: Query.accepts,
    newQuery: function() {
      this.queries.push(new Query());
      this.index += 1;
    }
  }
});

Vue.component('query-builder', QueryBuilder);
Vue.filter('type-to-string', function(value) {
  return ValueNames[value];
});
