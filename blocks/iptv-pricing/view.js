/**
 * Frontend Interactivity for IPTV Pricing & Packages Block
 * Handles M3U/MAG connection switching, device count filtering, and responsive carousel slider.
 */
document.addEventListener('DOMContentLoaded', function() {
  var blocks = document.querySelectorAll('.iptv-pricing-block');
  if (!blocks.length) return;

  blocks.forEach(function(block) {
    initIptvBlock(block);
  });

  function initIptvBlock(block) {
    var dataEl = block.querySelector('.iptv-packages-data');
    if (!dataEl) return;

    var config = {};
    try {
      config = JSON.parse(dataEl.textContent || '{}');
    } catch (e) {
      console.error('IPTV Pricing: Invalid packages JSON', e);
      return;
    }

    var allPackages = config.packages || [];
    var columnsDesktop = parseInt(config.columnsDesktop, 10) || 4;
    var currency = config.currencySymbol || '$';
    var buttonText = config.buttonText || 'Order Now';
    var deliveryBadge = config.deliveryBadge || 'Instant Delivery';
    var openInNewTab = config.openLinksInNewTab !== false;

    // State
    var currentConn = config.defaultConnectionType || 'M3U';
    var currentDevices = parseInt(config.defaultDevices, 10) || 1;
    var currentSlide = 0;

    // DOM Elements
    var connBtns = block.querySelectorAll('.iptv-conn-btn');
    var deviceContainer = block.querySelector('.iptv-device-selector');
    var track = block.querySelector('.iptv-cards-track');
    var prevBtn = block.querySelector('.iptv-carousel-nav.is-prev');
    var nextBtn = block.querySelector('.iptv-carousel-nav.is-next');
    var dotsContainer = block.querySelector('.iptv-carousel-dots');
    var viewport = block.querySelector('.iptv-cards-viewport');

    // Setup Connection Type Switcher Buttons
    connBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var selectedConn = btn.getAttribute('data-conn');
        if (selectedConn === currentConn) return;

        currentConn = selectedConn;
        connBtns.forEach(function(b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });

        // Refresh available device pills for newly selected connection type
        renderDevicePills();
        currentSlide = 0;
        renderCards();
      });
    });

    // Renders the Device Count Pills dynamically based on packages available
    function renderDevicePills() {
      if (!deviceContainer) return;

      // Extract unique device counts available for the selected connection type
      var availableDevices = [];
      allPackages.forEach(function(pkg) {
        if (!pkg.active || pkg.isDeleted) return;
        var cType = (pkg.connectionType || 'M3U').toUpperCase();
        var isMatch = (cType === 'BOTH') ||
          (currentConn === 'M3U' && cType === 'M3U') ||
          (currentConn === 'MAG' && (cType === 'MAC' || cType === 'MAG'));

        if (isMatch) {
          var dev = parseInt(pkg.devices, 10) || 1;
          if (availableDevices.indexOf(dev) === -1) {
            availableDevices.push(dev);
          }
        }
      });

      availableDevices.sort(function(a, b) { return a - b; });

      // If current selected device is not in the list, choose the first available
      if (availableDevices.indexOf(currentDevices) === -1 && availableDevices.length > 0) {
        currentDevices = availableDevices[0];
      }

      deviceContainer.innerHTML = '';
      availableDevices.forEach(function(dev) {
        var pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'iptv-device-btn' + (dev === currentDevices ? ' is-active' : '');
        pill.setAttribute('data-device', dev);
        pill.textContent = dev + (dev === 1 ? ' Device' : ' Devices');

        pill.addEventListener('click', function(e) {
          e.preventDefault();
          if (currentDevices === dev) return;
          currentDevices = dev;
          deviceContainer.querySelectorAll('.iptv-device-btn').forEach(function(p) {
            p.classList.toggle('is-active', p === pill);
          });
          currentSlide = 0;
          renderCards();
        });

        deviceContainer.appendChild(pill);
      });
    }

    // Helper: Determine visible columns based on screen width
    function getVisibleCols() {
      var w = window.innerWidth;
      if (w <= 520) return 1;
      if (w <= 768) return 2;
      if (w <= 1024) return Math.min(3, columnsDesktop);
      return columnsDesktop;
    }

    // Filter packages according to currentConn and currentDevices
    function getFilteredPackages() {
      return allPackages.filter(function(pkg) {
        if (pkg.active === false || pkg.isDeleted === true) return false;
        var cType = (pkg.connectionType || 'M3U').toUpperCase();
        var connMatch = (cType === 'BOTH') ||
          (currentConn === 'M3U' && cType === 'M3U') ||
          (currentConn === 'MAG' && (cType === 'MAC' || cType === 'MAG'));
        var devMatch = (parseInt(pkg.devices, 10) || 1) === currentDevices;
        return connMatch && devMatch;
      }).sort(function(a, b) {
        // Sort: trials first or by months asc
        if (a.isTrial && !b.isTrial) return -1;
        if (!a.isTrial && b.isTrial) return 1;
        var ma = (parseInt(a.months, 10) || 0) * 30 + (parseInt(a.hours, 10) || 0) / 24;
        var mb = (parseInt(b.months, 10) || 0) * 30 + (parseInt(b.hours, 10) || 0) / 24;
        return ma - mb;
      });
    }

    // Main Card Rendering & Carousel Synchronization
    function renderCards() {
      if (!track) return;

      var packages = getFilteredPackages();
      var visibleCols = getVisibleCols();
      var isCarousel = packages.length > visibleCols;

      track.innerHTML = '';

      if (packages.length === 0) {
        track.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--iptv-text-color); opacity: 0.7;">No packages available for this selection.</div>';
        updateCarouselControls(0, 0);
        return;
      }

      // Render each package card
      packages.forEach(function(pkg) {
        var card = document.createElement('div');
        card.className = 'iptv-card' + (pkg.popular ? ' is-popular' : '');

        // Popular ribbon
        if (pkg.popular) {
          var ribbon = document.createElement('div');
          ribbon.className = 'iptv-popular-ribbon';
          ribbon.textContent = 'Popular';
          card.appendChild(ribbon);
        }

        // Header
        var header = document.createElement('div');
        header.className = 'iptv-card-header';

        var title = document.createElement('h3');
        title.className = 'iptv-card-title';
        title.textContent = formatDurationTitle(pkg);
        header.appendChild(title);

        if (pkg.description) {
          var desc = document.createElement('p');
          desc.className = 'iptv-card-desc';
          desc.textContent = pkg.description;
          header.appendChild(desc);
        }
        card.appendChild(header);

        // Price banner
        var banner = document.createElement('div');
        banner.className = 'iptv-price-banner';

        var priceVal = document.createElement('div');
        priceVal.className = 'iptv-price-val';

        var currSpan = document.createElement('span');
        currSpan.className = 'iptv-currency';
        currSpan.textContent = currency;
        priceVal.appendChild(currSpan);

        var numSpan = document.createElement('span');
        numSpan.textContent = pkg.price != null ? pkg.price : '0';
        priceVal.appendChild(numSpan);
        banner.appendChild(priceVal);

        var durationLabel = document.createElement('div');
        durationLabel.className = 'iptv-duration-label';
        durationLabel.textContent = formatDurationSublabel(pkg);
        banner.appendChild(durationLabel);

        card.appendChild(banner);

        // Features list
        var featuresList = document.createElement('ul');
        featuresList.className = 'iptv-features';

        var feats = Array.isArray(pkg.features) && pkg.features.length ? pkg.features : [
          '15,000+ Live TV Channels',
          '1,30,000+ Movies',
          '34,000+ Series',
          'HD, FHD & 4K Channels',
          'TV Guide (EPG)',
          '100% Up-time',
          '24/7 Support'
        ];

        feats.forEach(function(featText) {
          var li = document.createElement('li');
          li.className = 'iptv-feature-item';

          // SVG Checkmark icon
          var checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          checkSvg.setAttribute('class', 'iptv-check-icon');
          checkSvg.setAttribute('viewBox', '0 0 20 20');
          checkSvg.innerHTML = '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" fill="currentColor"/>';

          li.appendChild(checkSvg);
          var span = document.createElement('span');
          span.textContent = featText;
          li.appendChild(span);
          featuresList.appendChild(li);
        });

        card.appendChild(featuresList);

        // Footer: Order button & instant delivery badge
        var footer = document.createElement('div');
        footer.className = 'iptv-card-footer';

        var orderLink = document.createElement('a');
        orderLink.className = 'iptv-btn-order';
        orderLink.textContent = buttonText;
        orderLink.href = pkg.packageLink || pkg.paymentLink || pkg.directLink || '#';
        if (openInNewTab) {
          orderLink.target = '_blank';
          orderLink.rel = 'noopener noreferrer';
        }
        footer.appendChild(orderLink);

        if (deliveryBadge) {
          var deliv = document.createElement('div');
          deliv.className = 'iptv-delivery-note';
          deliv.textContent = deliveryBadge;
          footer.appendChild(deliv);
        }

        card.appendChild(footer);
        track.appendChild(card);
      });

      // Handle Carousel vs Static Grid mode
      if (!isCarousel) {
        track.classList.add('is-grid');
        track.style.transform = 'none';
        updateCarouselControls(0, 0);
      } else {
        track.classList.remove('is-grid');
        var maxSlide = packages.length - visibleCols;
        if (currentSlide > maxSlide) currentSlide = maxSlide;
        if (currentSlide < 0) currentSlide = 0;
        updateTrackPosition();
        updateCarouselControls(packages.length, visibleCols);
      }
    }

    // Helper: Compute Duration Title (e.g. "1 Month", "24 Hours Trial")
    function formatDurationTitle(pkg) {
      if (pkg.name && pkg.name.trim() !== '') {
        return pkg.name;
      }
      if (pkg.isTrial || (pkg.hours && !pkg.months)) {
        return (pkg.hours || 24) + ' Hours Trial';
      }
      var m = parseInt(pkg.months, 10) || 1;
      if (m === 12) return '1 Year';
      if (m === 24) return '2 Years';
      return m + (m === 1 ? ' Month' : ' Months');
    }

    // Helper: Compute Sublabel (e.g. "30 Days", "365 Days")
    function formatDurationSublabel(pkg) {
      if (pkg.hours && (!pkg.months || pkg.months === 0)) {
        return pkg.hours + ' Hours Access';
      }
      var m = parseInt(pkg.months, 10) || 1;
      if (m === 1) return '30 Days';
      if (m === 3) return '90 Days';
      if (m === 6) return '180 Days';
      if (m === 12) return '365 Days';
      if (m === 24) return '730 Days';
      return (m * 30) + ' Days';
    }

    // Updates CSS transform on the track
    function updateTrackPosition() {
      if (!track || !viewport) return;
      var card = track.querySelector('.iptv-card');
      if (!card) return;

      var cardWidth = card.offsetWidth;
      var gap = 20; // 20px CSS gap
      var offset = currentSlide * (cardWidth + gap);
      track.style.transform = 'translateX(-' + offset + 'px)';
    }

    // Controls: Prev / Next buttons and pagination dots
    function updateCarouselControls(totalItems, visibleCols) {
      if (!prevBtn || !nextBtn) return;

      var maxSlide = totalItems - visibleCols;
      var shouldShow = totalItems > visibleCols && maxSlide > 0;

      prevBtn.style.display = shouldShow ? 'flex' : 'none';
      nextBtn.style.display = shouldShow ? 'flex' : 'none';

      if (shouldShow) {
        prevBtn.classList.toggle('is-disabled', currentSlide <= 0);
        nextBtn.classList.toggle('is-disabled', currentSlide >= maxSlide);
        prevBtn.disabled = currentSlide <= 0;
        nextBtn.disabled = currentSlide >= maxSlide;
      }

      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        if (shouldShow) {
          dotsContainer.style.display = 'flex';
          var totalDots = maxSlide + 1;
          for (var i = 0; i < totalDots; i++) {
            (function(idx) {
              var dot = document.createElement('button');
              dot.type = 'button';
              dot.className = 'iptv-dot' + (idx === currentSlide ? ' is-active' : '');
              dot.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
              dot.addEventListener('click', function() {
                currentSlide = idx;
                updateTrackPosition();
                updateCarouselControls(totalItems, visibleCols);
              });
              dotsContainer.appendChild(dot);
            })(i);
          }
        } else {
          dotsContainer.style.display = 'none';
        }
      }
    }

    // Carousel Button Listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var packages = getFilteredPackages();
        var visibleCols = getVisibleCols();
        if (currentSlide > 0) {
          currentSlide--;
          updateTrackPosition();
          updateCarouselControls(packages.length, visibleCols);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var packages = getFilteredPackages();
        var visibleCols = getVisibleCols();
        var maxSlide = packages.length - visibleCols;
        if (currentSlide < maxSlide) {
          currentSlide++;
          updateTrackPosition();
          updateCarouselControls(packages.length, visibleCols);
        }
      });
    }

    // Mobile Touch Swipe Handling
    var touchStartX = 0;
    var touchEndX = 0;
    if (viewport) {
      viewport.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      viewport.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        var diff = touchStartX - touchEndX;
        var packages = getFilteredPackages();
        var visibleCols = getVisibleCols();
        var maxSlide = packages.length - visibleCols;

        if (Math.abs(diff) > 45 && maxSlide > 0) {
          if (diff > 0 && currentSlide < maxSlide) {
            currentSlide++; // swipe left -> next
          } else if (diff < 0 && currentSlide > 0) {
            currentSlide--; // swipe right -> prev
          }
          updateTrackPosition();
          updateCarouselControls(packages.length, visibleCols);
        }
      }, { passive: true });
    }

    // Window Resize Debounce
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        renderCards();
      }, 150);
    });

    // Optional Live API Fetching on Frontend (uses proxy to bypass CORS)
    if (config.apiUrl && config.autoFetchFrontend) {
      var proxyEndpoint = '/wp-json/my-custom-plugin/v1/proxy-packages?url=' + encodeURIComponent(config.apiUrl.trim());
      fetch(proxyEndpoint)
        .then(function(res) {
          if (!res.ok) throw new Error('Proxy error');
          return res.json();
        })
        .then(function(result) {
          if (result && result.success && Array.isArray(result.packages)) {
            return result.packages;
          }
          throw new Error('Invalid packages from proxy');
        })
        .catch(function() {
          // Fallback to direct fetch
          return fetch(config.apiUrl).then(function(res) { return res.json(); }).then(function(data) {
            return Array.isArray(data) ? data : (data.packages || data.data || []);
          });
        })
        .then(function(pkgs) {
          if (Array.isArray(pkgs) && pkgs.length > 0) {
            allPackages = pkgs;
            renderDevicePills();
            renderCards();
          }
        })
        .catch(function(err) {
          console.warn('IPTV Pricing: Live API fetch skipped, using cached packages.', err);
        });
    }

    // Initial Mount
    renderDevicePills();
    renderCards();
  }
});
