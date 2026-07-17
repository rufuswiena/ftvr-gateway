(function(){
  'use strict';
  var routes = new Set(['home','story','timeline','join']);
  var alias = {
    about:'story', evidence:'story', third:'story', second:'story',
    logokit:'home', support:'home',
    'dn-article':'timeline', 'graz-timeline':'timeline',
    'efvl-non-response':'timeline', 'institutional-escalation':'timeline',
    'kleine-zeitung':'timeline', 'international-coverage':'timeline'
  };

  function parseHash(){
    var raw = (location.hash || '').slice(1);
    var parts = raw.split('/');
    var first = parts[0];
    var anchor = parts[1] || '';
    if (routes.has(first)) return {route:first, anchor:anchor};
    if (alias[first]) return {route:alias[first], anchor:first};
    return {route:'home', anchor:first};
  }

  function showRoute(){
    var parsed = parseHash();
    var route = parsed.route;
    var anchor = parsed.anchor;
    document.body.dataset.route = route;
    document.querySelectorAll('.v6-view').forEach(function(el){
      var views = (el.dataset.view || '').split(/\s+/);
      el.hidden = !views.includes(route);
    });
    document.querySelectorAll('.v6-nav a[data-route]').forEach(function(a){
      a.classList.toggle('active', a.dataset.route === route);
    });
    // Close any open overlays on route change
    closeAllOverlays();
    // Scroll behaviour: anchor > content-start (non-home) > top (home)
    if (anchor) {
      var target = document.getElementById(anchor);
      if (target) {
        setTimeout(function(){ scrollWithOffset(target); }, 60);
        return;
      }
    }
    if (route === 'home') {
      window.scrollTo({top:0, behavior:'smooth'});
    } else {
      // Jump to the start of the main content, just under the sticky nav
      var main = document.querySelector('.main');
      var firstView = document.querySelector('.v6-view:not([hidden])');
      var anchorEl = firstView || main;
      if (anchorEl) setTimeout(function(){ scrollWithOffset(anchorEl); }, 60);
      else window.scrollTo({top:0, behavior:'smooth'});
    }
  }

  function scrollWithOffset(el){
    var nav = document.querySelector('.v6-nav');
    var offset = nav ? nav.getBoundingClientRect().height + 8 : 0;
    var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({top: Math.max(0, y), behavior:'smooth'});
  }

  function closeAllOverlays(){
    // Close lightbox
    var lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('active');
    // Close all modals
    document.querySelectorAll('.modal-overlay.active').forEach(function(m){
      m.classList.remove('active');
    });
    // Restore scroll
    document.body.style.overflow = '';
  }

  // ═══ Lightbox: unified open/close ═══
  window.openLightbox = function(src){
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    if (!lb || !img) return;
    img.src = src;
    lb.classList.add('active');
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function(){
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    if (lb) { lb.classList.remove('active'); lb.style.display = 'none'; }
    if (img) img.src = '';
    document.body.style.overflow = '';
  };

  // ═══ Modal: unified open/close ═══
  window.openModal = function(id){
    var m = document.getElementById(id);
    if (m) { m.classList.add('active'); m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  };

  window.closeModalById = function(id){
    var m = document.getElementById(id);
    if (m) { m.classList.remove('active'); m.style.display = 'none'; }
    document.body.style.overflow = '';
  };

  window.closeModal = function(e, id){
    if (e.target === e.currentTarget) closeModalById(id);
  };

  // ═══ Toggle older latest-updates ═══
  window.toggleOlder = function(btn){
    var list = btn.nextElementSibling;
    if (!list) return;
    var isHidden = list.hasAttribute('hidden');
    if (isHidden){ list.removeAttribute('hidden'); btn.textContent = 'Show fewer updates ↑'; }
    else { list.setAttribute('hidden',''); btn.textContent = 'Show older updates ↓'; }
  };

  // ═══ Toggle for evidence read-more ═══
  window.toggle = function(btn){
    btn.classList.toggle('open');
    var next = btn.nextElementSibling;
    if (next) next.classList.toggle('open');
  };

  // ═══ Delegated click handler for evidence images ═══
  function handleImageClick(e){
    // Don't interfere with links or buttons
    if (e.target.closest('a[href], button, .grid-btn, .collapsible')) return;
    var img = e.target.closest('img');
    if (!img) return;
    // Skip supporter logos and non-evidence images
    if (img.closest('.supporters, .header, .header-logo, .hero, .hero-logo, nav, .dn-feature-media')) return;
    // Skip images that already have inline onclick
    if (img.getAttribute('onclick')) return;
    // Skip images inside elements with onclick
    if (img.closest('[onclick]')) return;
    e.preventDefault();
    e.stopPropagation();
    openLightbox(img.src);
  }

  // ═══ Init ═══
  window.addEventListener('hashchange', showRoute);

  document.addEventListener('DOMContentLoaded', function(){
    // v8: do not force #home on first visit; keep the clean root URL and show the hero.

    // Delegated image click — single handler, no conflicts
    document.addEventListener('click', handleImageClick);

    // Fix inline onclick images to use unified openLightbox
    document.querySelectorAll('img[onclick]').forEach(function(img){
      var onclickAttr = img.getAttribute('onclick');
      if (onclickAttr && onclickAttr.indexOf('lightbox') !== -1){
        img.removeAttribute('onclick');
        img.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          openLightbox(this.src);
        });
      }
    });

    // Fix inline onclick links that open lightbox for second screenshots
    document.querySelectorAll('a[onclick]').forEach(function(a){
      var onclickAttr = a.getAttribute('onclick');
      if (onclickAttr && onclickAttr.indexOf('lightbox') !== -1){
        var match = onclickAttr.match(/'([^']+)\.webp'/);
        if (match){
          var src = match[1] + '.webp';
          a.removeAttribute('onclick');
          a.setAttribute('href', '#');
          a.addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            openLightbox(src);
          });
        }
      }
    });

    // ESC closes everything
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){
        closeAllOverlays();
      }
    });

    showRoute();
  });
})();
