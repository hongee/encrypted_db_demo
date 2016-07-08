
var articleCount = $('.content').length;
var $nextBtn = $('.carousel-next');
var $prevBtn = $('.carousel-prev');
var $articleCarousel = $('.content-carousel');

var articleCarousel = {
	handleNext: function() {
		var $activeEl = $('.content.active');
		var index =$activeEl.data("index");
		$activeEl.removeClass('active');
		if(index < articleCount) {
			var $newEl = $('.content[data-index='+ (index+1) +']').addClass('active');
		} else {
			var $newEl = $('.content[data-index=1]').addClass('active');
		}
		var newindex = $newEl.data("index");
		$articleCarousel.css('transform', 'translateX(-' + (newindex-1)*100 + '%)');
		articleCarousel.setHeight($newEl.outerHeight());
	},
	handlePrev: function() {
		var $activeEl = $('.content.active');
		var index =$activeEl.data("index");
		$activeEl.removeClass('active');
		if(index > 1) {
			var $newEl = $('.content[data-index='+ (index-1) +']').addClass('active');
		} else {
			var $newEl = $('.content[data-index=3]').addClass('active');
		}
		var newindex = $newEl.data("index");
		$articleCarousel.css('transform', 'translateX(-' + (newindex-1)*100 + '%)');
		articleCarousel.setHeight($newEl.outerHeight());
	},
	setActive: function(index) {
		var $activeEl = $('.content.active');
		var $newEl = $('.content[data-index='+ (index) +']').addClass('active');
		var newindex = $newEl.data("index");
		$articleCarousel.css('transform', 'translateX(-' + (newindex-1)*100 + '%)');
		articleCarousel.setHeight($newEl.outerHeight());
	}
}
//Handlers
$nextBtn.click(articleCarousel.handleNext);
$prevBtn.click(articleCarousel.handlePrev);
$articleCarousel.on("swipeleft", articleCarousel.handleNext);
$articleCarousel.on("swiperight", articleCarousel.handlePrev);

$("body").keydown(function(e){
	//left arrow
	if(e.which == 37) {
		articleCarousel.handlePrev();
	}
	//right arrow
	if(e.which == 39) {
		articleCarousel.handleNext();
	}
});

$('.navi-btn').click(function(){
	articleCarousel.setActive($(this).data("id"));
});

/* Typed */

var $titleText = $('#title-text');

$titleText.typed({
  strings: ['Smarter', 'Faster', 'Larger', 'Stronger'],
  typeSpeed: 100,
  backSpeed: 60,
  backDelay: 900,
  loop: true
})

/* Highlight */
hljs.initHighlightingOnLoad();

/* Parallax Effect */

var controller = new ScrollMagic.Controller({globalSceneOptions: {triggerHook: "onEnter", duration: "200%"}});

var parallax1 = new ScrollMagic.Scene({triggerElement: "#pimg1"})
					.setTween('#pimg1-p', {y: "40%", ease: Linear.easeNone})
					.addTo(controller);

var parallax2 = new ScrollMagic.Scene({triggerElement: "#pimg2"})
					.setTween('#pimg2-p', {y: "40%", ease: Linear.easeNone})
					.addTo(controller);

var fadeInNav2 = new ScrollMagic.Scene({triggerElement: "#encr-section"})
          .setTween("#encr-section > .horizontal-nav", {autoAlpha: 1})
          .addTo(controller);

controller.scrollTo(function (newpos) {
	TweenMax.to(window, 0.5, {scrollTo: {y: newpos}});
});

$(document).on("click", "a[href^='#']", function (e) {
  var id = $(this).attr("href");
  if ($(id).length > 0) {
    e.preventDefault();

    // trigger scroll
    controller.scrollTo(id);

      // if supported by the browser we can even update the URL.
    if (window.history && window.history.pushState) {
      history.pushState("", document.title, id);
    }
  }
});
