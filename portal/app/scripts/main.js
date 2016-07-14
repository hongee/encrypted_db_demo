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
