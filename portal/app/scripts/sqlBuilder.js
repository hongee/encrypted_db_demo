const Verbs = {
  "SELECT": ["INTO", "FROM"],
  "INSERT INTO": ["VALUES"],
  "UPDATE" : ["SET"],
  "DELETE FROM": ["WHERE"],
  "ALTER TABLE": ["ADD", "DROP COLUMN"]
}

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
