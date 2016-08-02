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
var controller = new ScrollMagic.Controller({globalSceneOptions: {triggerHook: 'onEnter'}});

var parallax1 = new ScrollMagic.Scene({triggerElement: '#pimg1', duration: '200%'})
					.setTween('#pimg1-p', {y: '40%', ease: Linear.easeNone})
					.addTo(controller);

var parallax2 = new ScrollMagic.Scene({triggerElement: '#pimg2', duration: '200%'})
					.setTween('#pimg2-p', {y: '40%', ease: Linear.easeNone})
					.addTo(controller);

var fadeInNav2 = new ScrollMagic.Scene({triggerElement: '#encr-section', duration: '40%'})
          .setTween('#encr-section > .horizontal-nav', {autoAlpha: 1})
          .addTo(controller);

//// Anon
var movingTaxi = new ScrollMagic.Scene({triggerElement: 'div[data-anon-ani="1"]', duration: '60%', offset: 200})
          .setTween('#moving-taxi', {autoAlpha: 0, scaleX: 2, scaleY: 2})
          .on('start', function() {   $('#license-no')[0].innerText = '3T77'; })
          .addTo(controller);

var license = new ScrollMagic.Scene({triggerElement: 'div[data-anon-ani="1"]', duration: '30%', offset: 300})
          .setTween('#license', {autoAlpha: 1, y: '-10'})
          .addTo(controller);

var encrAni = new ScrollMagic.Scene({triggerElement: 'div[data-anon-ani="1"]', offset: 550})
          .on('start', function() { setTimeout(animateEncryption, 1000); })
          .addTo(controller);

var rainbowTable = new ScrollMagic.Scene({triggerElement: 'div[data-anon-ani="2"]', offset: 200, duration: '70%'})
          .setTween('#table-wrapper .table', {y: '0', ease: Expo.easeOut})
          .addTo(controller);

var foundMatch = new ScrollMagic.Scene({triggerElement: 'div[data-anon-ani="2"]', offset: 250, duration: '100%'})
          .setTween('#found-match', {scaleX: 1.1, scaleY: 1.1, ease: Expo.easeOut})
          .addTo(controller);

var bouncingDb = new ScrollMagic.Scene({triggerElement: 'div[data-anon-ani="3"]', offset: 200, duration: '50%'})
          .setTween('.db', {y: '10', scaleX: 3, scaleY: 3, ease: Bounce.easeInOut})
          .addTo(controller);

var glassesDb = new ScrollMagic.Scene({triggerElement: 'div[data-anon-ani="3"]', offset: 240, duration: '50%'})
          .setTween('.glasses', {x: '270', scaleX: 4, scaleY: 4, ease: Bounce.easeInOut})
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

sandboxSection.init();

var isAnimating = false;

function animateEncryption() {
  if(isAnimating) return;

  isAnimating = true;

  var $license = $('#license-no')[0];
  $license.innerText = '3T77';
  var finalArray = ['c','8','c','c','0','3','3','4','8'];
  var transformCounts = new Array(finalArray.length).fill(0);
  var textArray = $license.innerText.split('');
  var maxLen = finalArray.length;
  var maxIterations = 12;
  var done = 0;

  function tick() {
    //on every iteration, either replace one character
    var rand = Math.random();
    if(textArray.length != maxLen && (rand < 0.1)) {
      textArray.push(Math.random().toString(36).substring(2,3));
    } else {
      var yetToDoSomething = true;
      while(yetToDoSomething) {
        var index = Math.round(Math.random() * maxLen);
        if(transformCounts[index] < maxIterations) {
          //replace text
          textArray[index] = Math.random().toString(36).substring(2,3);
          transformCounts[index] += 1;
          yetToDoSomething = false;
        } else if(transformCounts[index] == maxIterations) {
          textArray[index] = finalArray[index];
          transformCounts[index] += 1;
          done += 1;
          yetToDoSomething = false;
        } else {
          continue;
        }
      }
    }

    $license.innerText = textArray.join('');
    if(done != finalArray.length)
      setTimeout(tick, 30);
    else
      isAnimating = false;

  }

  tick();
}

function initMd5Table() {
  var table = '';
  for (var i = 0; i < 100; i++) {
    var vl = Math.round(Math.random() * 10) + '' + Math.random().toString(36).substring(2,3) + Math.round(Math.random() * 10) + Math.round(Math.random() * 10);
    vl = vl.toUpperCase();
    var md5 = CryptoJS.MD5(vl).toString().substring(0,9);

    table += `
      <tr>
        <td>${vl}</td>
        <td>${md5}</td>
        <td></td>
      </tr>
    `
  }
  $('#table-wrapper tbody').append(table);
};

initMd5Table();
