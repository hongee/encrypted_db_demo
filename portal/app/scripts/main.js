/* Entry points and animations */

/* Spinner options */
var spinnerOpts = {
  lines: 7 // The number of lines to draw
, length: 0 // The length of each line
, width: 8 // The line thickness
, radius: 24 // The radius of the inner circle
, scale: 1 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: '#000' // #rgb or #rrggbb or array of colors
, opacity: 0.25 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 60 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: 'spinner' // The CSS class to assign to the spinner
, top: '50%' // Top position relative to parent
, left: '50%' // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: true // Whether to use hardware acceleration
, position: 'absolute' // Element positioning
}

/* Tooltips */
$('[data-toggle="tooltip"]').tooltip()

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
hljs.configure({
	languages: ['sql']
})
hljs.initHighlightingOnLoad();

/* Parallax Effect */
var controller = new ScrollMagic.Controller({globalSceneOptions: {triggerHook: 'onEnter', duration: '200%'}});

var parallax1 = new ScrollMagic.Scene({triggerElement: '#pimg1'})
					.setTween('#pimg1-p', {y: '40%', ease: Linear.easeNone})
					.addTo(controller);

var parallax2 = new ScrollMagic.Scene({triggerElement: '#pimg2'})
					.setTween('#pimg2-p', {y: '40%', ease: Linear.easeNone})
					.addTo(controller);

var fadeInNav2 = new ScrollMagic.Scene({triggerElement: '#encr-section'})
          .setTween('#encr-section > .horizontal-nav', {autoAlpha: 1})
          .addTo(controller);

controller.scrollTo(function (newpos) {
	TweenMax.to(window, 0.5, {scrollTo: {y: newpos}});
});

/* Smooth Scroll Anchor Nav */
$(document).on('click', 'a[href^=\'#\']', function (e) {
  var id = $(this).attr('href');
  if ($(id).length > 0) {
    e.preventDefault();

    // trigger scroll
    controller.scrollTo(id);

      // if supported by the browser we can even update the URL.
    if (window.history && window.history.pushState) {
      history.pushState('', document.title, id);
    }
  }
});

/* Loads Sandbox if Exists */
sandboxSection.init();
