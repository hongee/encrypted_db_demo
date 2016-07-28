/*

*/

var scrollSection = new Vue({
  el: "#encr-section",
  data: {
    currentIndex: 0,
    totalItems: $(".horizontal-item").length
  },
  methods: {
    goTo: function(e) {
      var $scrollWrap = $(this.$el).find(".horizontal-scroll");
      var $el = $(e.target);
      var index = $el.data('index');
      if(index == this.currentIndex)
        return;
      $scrollWrap.css('transform', 'translateX(-' + (index)*100 + '%)' );
      this.currentIndex = index;
    }
  }

});
