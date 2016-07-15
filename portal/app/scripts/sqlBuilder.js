const Verbs = {
  "SELECT": ["INTO", "FROM"],
  "INSERT INTO": ["VALUES"],
  "UPDATE" : ["SET"],
  "DELETE FROM": ["WHERE"],
  "ALTER TABLE": ["ADD", "DROP COLUMN"]
}

//const Wildcards = ['*'  'Selects All Columns'];

const Aggregates = [];

Object.defineProperty(Verbs, "SELECT DISTINCT", {
  get: function() { return this["SELECT"] }
});

const Types = {

}

const Modifiers = {
  "INTO": ["FROM"],
  "WHERE": ["AND", "OR"],
  "JOIN": ["ON"],
  "ON": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"],
  "FROM": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"]
}

Modifiers["FROM"].forEach(function(term) {
  if(term.includes("JOIN")) {
    Object.defineProperty(Verbs, term, {
      get: function() { return this["JOIN"] }
    });
  }
});

class Query {
  constructor(verb) {
    this.verb = verb ? verb : "SELECT";
    this.columns = [];
    this.modifiers = [];
    this.tables = [];
  }

  selectVerb() {
    this.columns.push("");
    this.modifiers.push("");
  }
}

var queryBuilderSection = new Vue({
  el: "#query-builder",
  data: {
    queries: [],
    index: -1,
    Verbs: Verbs
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
  methods: {
    init: function() {
      var queries = localStorage.getItem("saved_queries");
      if(!queries) {
        this.newQuery();
      } else {
        this.queries = queries;
      }
    },

    newQuery: function() {
      this.queries.push(new Query());
      this.index += 1;
    }

  }
})
