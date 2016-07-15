Vue.filter('syntax', function(value) {
  if(!value) return "";
  return hljs.highlightAuto(value).value;
});
