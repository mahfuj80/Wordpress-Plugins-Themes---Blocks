( function( wp ) {
  var el = wp.element.createElement;
  var useState = wp.element.useState;
  var Fragment = wp.element.Fragment;
  var registerBlockType = wp.blocks.registerBlockType;
  var blockEditor = wp.blockEditor || wp.editor;
  var useBlockProps = blockEditor.useBlockProps;
  var InspectorControls = blockEditor.InspectorControls;
  var components = wp.components;
  var PanelBody = components.PanelBody;
  var SelectControl = components.SelectControl;
  var ToggleControl = components.ToggleControl;
  var RangeControl = components.RangeControl;
  var ColorPalette = components.ColorPalette;
  var TextControl = components.TextControl;
  var TextareaControl = components.TextareaControl;
  var Button = components.Button;
  var Modal = components.Modal;
  var __ = wp.i18n.__;
  var sprintf = function( fmt ) {
    if ( wp.i18n && typeof wp.i18n.sprintf === 'function' ) {
      return wp.i18n.sprintf.apply( wp.i18n, arguments );
    }
    var args = Array.prototype.slice.call( arguments, 1 );
    return fmt.replace( /%[ds]/g, function() {
      return args.shift();
    } );
  };

  // Preset theme definitions matching provided designs
  var THEME_PRESETS = {
    'dark-nebula': {
      label: 'Dark Nebula (Screenshot 1)',
      accentColor: '#d6287c',
      accentTextColor: '#ffffff',
      bgColor: '#0b0f19',
      cardBgColor: '#111827',
      cardBorderColor: 'rgba(255, 255, 255, 0.14)',
      titleColor: '#ffffff',
      textColor: '#cbd5e1',
      priceBgColor: '#d6287c',
      priceTextColor: '#ffffff',
      buttonBgColor: '#d6287c',
      buttonTextColor: '#ffffff',
      buttonHoverBgColor: '#be185d',
      borderRadius: 14
    },
    'light-blue': {
      label: 'Crisp Royal Blue (Screenshot 2)',
      accentColor: '#2563eb',
      accentTextColor: '#ffffff',
      bgColor: '#f8fafc',
      cardBgColor: '#ffffff',
      cardBorderColor: '#e2e8f0',
      titleColor: '#0f172a',
      textColor: '#475569',
      priceBgColor: '#2563eb',
      priceTextColor: '#ffffff',
      buttonBgColor: '#2563eb',
      buttonTextColor: '#ffffff',
      buttonHoverBgColor: '#1d4ed8',
      borderRadius: 12
    },
    'cyber-violet': {
      label: 'Cyber Violet',
      accentColor: '#8b5cf6',
      accentTextColor: '#ffffff',
      bgColor: '#090614',
      cardBgColor: '#130e24',
      cardBorderColor: 'rgba(139, 92, 246, 0.25)',
      titleColor: '#ffffff',
      textColor: '#c4b5fd',
      priceBgColor: '#7c3aed',
      priceTextColor: '#ffffff',
      buttonBgColor: '#8b5cf6',
      buttonTextColor: '#ffffff',
      buttonHoverBgColor: '#7c3aed',
      borderRadius: 16
    },
    'emerald': {
      label: 'Emerald Stream',
      accentColor: '#059669',
      accentTextColor: '#ffffff',
      bgColor: '#061811',
      cardBgColor: '#0c2b1f',
      cardBorderColor: 'rgba(5, 150, 105, 0.3)',
      titleColor: '#ffffff',
      textColor: '#a7f3d0',
      priceBgColor: '#059669',
      priceTextColor: '#ffffff',
      buttonBgColor: '#059669',
      buttonTextColor: '#ffffff',
      buttonHoverBgColor: '#047857',
      borderRadius: 14
    }
  };

  registerBlockType( 'my-custom-plugin/iptv-pricing', {
    edit: function( props ) {
      var attributes = props.attributes;
      var setAttributes = props.setAttributes;

      var apiUrl = attributes.apiUrl || '';
      var autoFetchFrontend = !!attributes.autoFetchFrontend;
      var themePreset = attributes.themePreset || 'dark-nebula';
      var accentColor = attributes.accentColor || '#d6287c';
      var accentTextColor = attributes.accentTextColor || '#ffffff';
      var bgColor = attributes.bgColor || '#0b0f19';
      var cardBgColor = attributes.cardBgColor || '#111827';
      var cardBorderColor = attributes.cardBorderColor || 'rgba(255, 255, 255, 0.14)';
      var titleColor = attributes.titleColor || '#ffffff';
      var textColor = attributes.textColor || '#cbd5e1';
      var priceBgColor = attributes.priceBgColor || '#d6287c';
      var priceTextColor = attributes.priceTextColor || '#ffffff';
      var buttonBgColor = attributes.buttonBgColor || '#d6287c';
      var buttonTextColor = attributes.buttonTextColor || '#ffffff';
      var buttonHoverBgColor = attributes.buttonHoverBgColor || '#be185d';
      var borderRadius = attributes.borderRadius != null ? attributes.borderRadius : 14;

      var badge = attributes.badge || 'Nixon IPTV Subscriptions';
      var title = attributes.title || 'Pick Your Nixon IPTV Plan';
      var subtitle = attributes.subtitle || 'The longer you subscribe, the more you save. All plans include the same premium content just choose what works for you.';
      var currencySymbol = attributes.currencySymbol || '$';
      var buttonText = attributes.buttonText || 'Order Now';
      var deliveryBadge = attributes.deliveryBadge || 'Instant Delivery';
      var m3uTabLabel = attributes.m3uTabLabel || 'M3U Playlist';
      var magTabLabel = attributes.magTabLabel || 'MAG / Portal';
      var columnsDesktop = attributes.columnsDesktop || 4;
      var defaultConnectionType = attributes.defaultConnectionType || 'M3U';
      var defaultDevices = parseInt( attributes.defaultDevices, 10 ) || 1;
      var openLinksInNewTab = attributes.openLinksInNewTab !== false;
      var headingTag = attributes.headingTag || 'h2';
      var cardHeadingTag = attributes.cardHeadingTag || 'h3';
      var linkRel = attributes.linkRel || 'sponsored nofollow noopener';
      var enableSchema = attributes.enableSchema !== false;
      var packages = Array.isArray( attributes.packages ) ? attributes.packages : [];

      // Local Editor State for interactive previewing
      var previewConnState = useState( defaultConnectionType );
      var activeConn = previewConnState[0];
      var setActiveConn = previewConnState[1];

      var previewDeviceState = useState( defaultDevices );
      var activeDevice = previewDeviceState[0];
      var setActiveDevice = previewDeviceState[1];

      var previewSlideState = useState( 0 );
      var currentSlide = previewSlideState[0];
      var setCurrentSlide = previewSlideState[1];

      var apiLoadingState = useState( false );
      var isApiLoading = apiLoadingState[0];
      var setIsApiLoading = apiLoadingState[1];

      var apiStatusState = useState( null );
      var apiStatus = apiStatusState[0];
      var setApiStatus = apiStatusState[1];

      var jsonModalState = useState( false );
      var isJsonModalOpen = jsonModalState[0];
      var setIsJsonModalOpen = jsonModalState[1];

      var rawJsonState = useState( '' );
      var rawJson = rawJsonState[0];
      var setRawJson = rawJsonState[1];

      // Apply Theme Preset
      function applyPreset( key ) {
        var preset = THEME_PRESETS[ key ];
        if ( ! preset ) return;
        setAttributes( {
          themePreset: key,
          accentColor: preset.accentColor,
          accentTextColor: preset.accentTextColor,
          bgColor: preset.bgColor,
          cardBgColor: preset.cardBgColor,
          cardBorderColor: preset.cardBorderColor,
          titleColor: preset.titleColor,
          textColor: preset.textColor,
          priceBgColor: preset.priceBgColor,
          priceTextColor: preset.priceTextColor,
          buttonBgColor: preset.buttonBgColor,
          buttonTextColor: preset.buttonTextColor,
          buttonHoverBgColor: preset.buttonHoverBgColor,
          borderRadius: preset.borderRadius
        } );
      }

      // Fetch from API function (bypasses browser CORS via WordPress Server Proxy)
      function fetchPackagesFromApi() {
        if ( ! apiUrl || apiUrl.trim() === '' ) {
          setApiStatus( { type: 'error', message: __( 'Please enter a valid API URL first.', 'my-custom-plugin' ) } );
          return;
        }

        setIsApiLoading( true );
        setApiStatus( null );

        var cleanUrl = apiUrl.trim();
        var proxyEndpoint = '/wp-json/my-custom-plugin/v1/proxy-packages?url=' + encodeURIComponent( cleanUrl );

        // 1. Try WordPress server-side proxy first (bypasses CORS restrictions)
        window.fetch( proxyEndpoint, {
          credentials: 'same-origin',
          headers: {
            'X-WP-Nonce': ( window.wpApiSettings && window.wpApiSettings.nonce ) || ''
          }
        } )
          .then( function( res ) {
            return res.json().then( function( json ) {
              return { ok: res.ok, status: res.status, json: json };
            } );
          } )
          .then( function( result ) {
            if ( result.ok && result.json && result.json.success && Array.isArray( result.json.packages ) ) {
              var pkgs = result.json.packages;
              setAttributes( { packages: pkgs } );
              setIsApiLoading( false );
              setApiStatus( {
                type: 'success',
                message: sprintf( __( 'Successfully synced %d packages from API!', 'my-custom-plugin' ), pkgs.length )
              } );
              return;
            }

            // 2. If proxy returns error or fails, attempt direct fetch as fallback
            return window.fetch( cleanUrl )
              .then( function( directRes ) {
                if ( ! directRes.ok ) throw new Error( 'HTTP ' + directRes.status + ': ' + directRes.statusText );
                return directRes.json();
              } )
              .then( function( directData ) {
                var directPkgs = Array.isArray( directData ) ? directData : ( directData.packages || directData.data || [] );
                if ( ! directPkgs || ! directPkgs.length ) {
                  throw new Error( __( 'API returned 0 packages or unsupported format.', 'my-custom-plugin' ) );
                }
                setAttributes( { packages: directPkgs } );
                setIsApiLoading( false );
                setApiStatus( {
                  type: 'success',
                  message: sprintf( __( 'Successfully synced %d packages from API!', 'my-custom-plugin' ), directPkgs.length )
                } );
              } )
              .catch( function( directErr ) {
                var proxyMsg = ( result.json && result.json.message ) ? result.json.message : '';
                throw new Error( proxyMsg || directErr.message || 'CORS or network error' );
              } );
          } )
          .catch( function( err ) {
            setIsApiLoading( false );
            setApiStatus( {
              type: 'error',
              message: sprintf( __( 'Failed to fetch API: %s', 'my-custom-plugin' ), err.message || err )
            } );
          } );
      }

      // Filter packages for editor preview
      var availableDevices = [];
      packages.forEach( function( pkg ) {
        if ( pkg.active === false || pkg.isDeleted === true ) return;
        var cType = ( pkg.connectionType || 'M3U' ).toUpperCase();
        var isMatch = ( cType === 'BOTH' ) ||
          ( activeConn === 'M3U' && cType === 'M3U' ) ||
          ( activeConn === 'MAG' && ( cType === 'MAC' || cType === 'MAG' ) );

        if ( isMatch ) {
          var dev = parseInt( pkg.devices, 10 ) || 1;
          if ( availableDevices.indexOf( dev ) === -1 ) {
            availableDevices.push( dev );
          }
        }
      } );
      availableDevices.sort( function( a, b ) { return a - b; } );

      // Compute effective active device safely without updating state during render
      var effectiveDevice = ( availableDevices.indexOf( activeDevice ) !== -1 ) ? activeDevice : ( availableDevices[0] || 1 );

      var filteredPackages = packages.filter( function( pkg ) {
        if ( pkg.active === false || pkg.isDeleted === true ) return false;
        var cType = ( pkg.connectionType || 'M3U' ).toUpperCase();
        var connMatch = ( cType === 'BOTH' ) ||
          ( activeConn === 'M3U' && cType === 'M3U' ) ||
          ( activeConn === 'MAG' && ( cType === 'MAC' || cType === 'MAG' ) );
        var devMatch = ( parseInt( pkg.devices, 10 ) || 1 ) === effectiveDevice;
        return connMatch && devMatch;
      } ).sort( function( a, b ) {
        if ( a.isTrial && ! b.isTrial ) return -1;
        if ( ! a.isTrial && b.isTrial ) return 1;
        var ma = ( parseInt( a.months, 10 ) || 0 ) * 30 + ( parseInt( a.hours, 10 ) || 0 ) / 24;
        var mb = ( parseInt( b.months, 10 ) || 0 ) * 30 + ( parseInt( b.hours, 10 ) || 0 ) / 24;
        return ma - mb;
      } );

      var visibleCols = columnsDesktop;
      var isCarousel = filteredPackages.length > visibleCols;
      var maxSlide = Math.max( 0, filteredPackages.length - visibleCols );

      // CSS custom properties style object for wrapper
      var blockStyles = {
        '--iptv-accent': accentColor,
        '--iptv-accent-text': accentTextColor,
        '--iptv-bg': bgColor,
        '--iptv-card-bg': cardBgColor,
        '--iptv-card-border': cardBorderColor,
        '--iptv-title-color': titleColor,
        '--iptv-text-color': textColor,
        '--iptv-price-bg': priceBgColor,
        '--iptv-price-text': priceTextColor,
        '--iptv-btn-bg': buttonBgColor,
        '--iptv-btn-text': buttonTextColor,
        '--iptv-btn-hover': buttonHoverBgColor,
        '--iptv-radius': borderRadius + 'px',
        '--iptv-cols': columnsDesktop
      };

      var blockProps = useBlockProps( {
        className: 'iptv-pricing-block theme-' + themePreset,
        style: blockStyles
      } );

      // Generate pagination dots
      var dotsElements = [];
      if ( isCarousel ) {
        for ( var d = 0; d <= maxSlide; d++ ) {
          ( function( dotIdx ) {
            dotsElements.push( el( 'button', {
              key: dotIdx,
              type: 'button',
              className: 'iptv-dot' + ( dotIdx === currentSlide ? ' is-active' : '' ),
              onClick: function() { setCurrentSlide( dotIdx ); }
            } ) );
          } )( d );
        }
      }

      return el(
        Fragment,
        null,
        el(
          InspectorControls,
          null,

          // 1. API & Data Panel
          el(
            PanelBody,
            { title: __( '📡 API & Data Source', 'my-custom-plugin' ), initialOpen: true },
            el( TextControl, {
              label: __( 'API Endpoint URL', 'my-custom-plugin' ),
              value: apiUrl,
              placeholder: 'https://rankescalate.com/api/packages',
              help: __( 'Enter your IPTV backend API URL returning packages JSON.', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { apiUrl: val } ); }
            } ),
            el(
              'div',
              { style: { display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' } },
              el( Button, {
                variant: 'primary',
                isBusy: isApiLoading,
                onClick: fetchPackagesFromApi
              }, __( '⚡ Fetch Packages Now', 'my-custom-plugin' ) ),
              el( Button, {
                variant: 'secondary',
                onClick: function() {
                  setRawJson( JSON.stringify( packages, null, 2 ) );
                  setIsJsonModalOpen( true );
                }
              }, __( 'Edit JSON', 'my-custom-plugin' ) )
            ),
            apiStatus && el(
              'div',
              { className: 'iptv-api-status is-' + apiStatus.type },
              apiStatus.message
            ),
            el( ToggleControl, {
              label: __( 'Auto Fetch on Frontend', 'my-custom-plugin' ),
              checked: autoFetchFrontend,
              help: __( 'Fetch live pricing in visitor browser if API is accessible.', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { autoFetchFrontend: val } ); }
            } ),
            el(
              'p',
              { style: { fontSize: '12px', color: '#64748b', marginTop: '12px' } },
              __( 'Loaded packages: ', 'my-custom-plugin' ) + packages.length + __( ' items', 'my-custom-plugin' )
            )
          ),

          // 2. Theme & Design Presets
          el(
            PanelBody,
            { title: __( '🎨 Theme Presets & Colors', 'my-custom-plugin' ), initialOpen: false },
            el(
              'div',
              { className: 'iptv-theme-preset-grid' },
              Object.keys( THEME_PRESETS ).map( function( key ) {
                var p = THEME_PRESETS[ key ];
                return el(
                  'div',
                  {
                    key: key,
                    className: 'iptv-preset-card' + ( themePreset === key ? ' is-active' : '' ),
                    onClick: function() { applyPreset( key ); }
                  },
                  el( 'div', {
                    className: 'iptv-preset-preview',
                    style: { background: 'linear-gradient(135deg, ' + p.bgColor + ' 0%, ' + p.priceBgColor + ' 100%)' }
                  } ),
                  el( 'div', { className: 'iptv-preset-title' }, p.label )
                );
              } )
            ),
            el( 'p', { style: { fontWeight: '600', margin: '14px 0 6px 0' } }, __( 'Accent / Tab Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: accentColor,
              onChange: function( val ) { setAttributes( { accentColor: val || '#d6287c' } ); }
            } ),
            el( 'p', { style: { fontWeight: '600', margin: '14px 0 6px 0' } }, __( 'Price Banner Background', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: priceBgColor,
              onChange: function( val ) { setAttributes( { priceBgColor: val || '#d6287c' } ); }
            } ),
            el( 'p', { style: { fontWeight: '600', margin: '14px 0 6px 0' } }, __( 'Block Background', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: bgColor,
              onChange: function( val ) { setAttributes( { bgColor: val || '#0b0f19' } ); }
            } ),
            el( 'p', { style: { fontWeight: '600', margin: '14px 0 6px 0' } }, __( 'Card Background', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: cardBgColor,
              onChange: function( val ) { setAttributes( { cardBgColor: val || '#111827' } ); }
            } ),
            el( 'p', { style: { fontWeight: '600', margin: '14px 0 6px 0' } }, __( 'Button Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: buttonBgColor,
              onChange: function( val ) { setAttributes( { buttonBgColor: val || '#d6287c' } ); }
            } ),
            el( RangeControl, {
              label: __( 'Card Border Radius (px)', 'my-custom-plugin' ),
              value: borderRadius,
              min: 0,
              max: 28,
              onChange: function( val ) { setAttributes( { borderRadius: val } ); }
            } )
          ),

          // 3. Layout & Filter Settings
          el(
            PanelBody,
            { title: __( '⚙️ Layout & Filtering', 'my-custom-plugin' ), initialOpen: false },
            el( RangeControl, {
              label: __( 'Columns (Desktop)', 'my-custom-plugin' ),
              value: columnsDesktop,
              min: 1,
              max: 4,
              onChange: function( val ) { setAttributes( { columnsDesktop: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Default Connection Tab', 'my-custom-plugin' ),
              value: defaultConnectionType,
              options: [
                { label: 'M3U Playlist', value: 'M3U' },
                { label: 'MAG Device', value: 'MAG' }
              ],
              onChange: function( val ) { setAttributes( { defaultConnectionType: val } ); }
            } ),
            el( TextControl, {
              label: __( 'M3U Tab Label', 'my-custom-plugin' ),
              value: m3uTabLabel,
              onChange: function( val ) { setAttributes( { m3uTabLabel: val } ); }
            } ),
            el( TextControl, {
              label: __( 'MAG Tab Label', 'my-custom-plugin' ),
              value: magTabLabel,
              onChange: function( val ) { setAttributes( { magTabLabel: val } ); }
            } ),
            el( ToggleControl, {
              label: __( 'Open Order Links in New Tab', 'my-custom-plugin' ),
              checked: openLinksInNewTab,
              onChange: function( val ) { setAttributes( { openLinksInNewTab: val } ); }
            } )
          ),

          // 4. Content & Text Settings
          el(
            PanelBody,
            { title: __( '✍️ Content & Headings', 'my-custom-plugin' ), initialOpen: false },
            el( TextControl, {
              label: __( 'Top Badge Text', 'my-custom-plugin' ),
              value: badge,
              onChange: function( val ) { setAttributes( { badge: val } ); }
            } ),
            el( TextControl, {
              label: __( 'Main Heading', 'my-custom-plugin' ),
              value: title,
              onChange: function( val ) { setAttributes( { title: val } ); }
            } ),
            el( TextareaControl, {
              label: __( 'Sub-heading Description', 'my-custom-plugin' ),
              value: subtitle,
              onChange: function( val ) { setAttributes( { subtitle: val } ); }
            } ),
            el( TextControl, {
              label: __( 'Currency Symbol', 'my-custom-plugin' ),
              value: currencySymbol,
              onChange: function( val ) { setAttributes( { currencySymbol: val } ); }
            } ),
            el( TextControl, {
              label: __( 'Order Button Text', 'my-custom-plugin' ),
              value: buttonText,
              onChange: function( val ) { setAttributes( { buttonText: val } ); }
            } ),
            el( TextControl, {
              label: __( 'Delivery Note Below Button', 'my-custom-plugin' ),
              value: deliveryBadge,
              onChange: function( val ) { setAttributes( { deliveryBadge: val } ); }
            } )
          ),

          // 5. SEO & Search Engines Panel
          el(
            PanelBody,
            { title: __( '🔍 SEO & Search Engines', 'my-custom-plugin' ), initialOpen: false },
            el( ToggleControl, {
              label: __( 'Enable Schema.org Structured Data', 'my-custom-plugin' ),
              checked: enableSchema,
              help: __( 'Adds JSON-LD ItemList with Product & Offer schema for Google Rich Snippets.', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { enableSchema: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Section Heading Level', 'my-custom-plugin' ),
              value: headingTag,
              options: [
                { label: 'H2 (Standard)', value: 'h2' },
                { label: 'H3 (Nested Section)', value: 'h3' },
                { label: 'H4 (Minor Section)', value: 'h4' }
              ],
              help: __( 'Maintains semantic heading hierarchy for SEO audit tools (RankMath, Yoast).', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { headingTag: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Card Title Heading Level', 'my-custom-plugin' ),
              value: cardHeadingTag,
              options: [
                { label: 'H3 (Recommended)', value: 'h3' },
                { label: 'H4 (Sub-heading)', value: 'h4' },
                { label: 'H5 (Minor)', value: 'h5' },
                { label: 'DIV (Non-heading)', value: 'div' }
              ],
              onChange: function( val ) { setAttributes( { cardHeadingTag: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Outbound Link Relationship (rel)', 'my-custom-plugin' ),
              value: linkRel,
              options: [
                { label: 'sponsored nofollow noopener (Google Recommended for Affiliate/Buy links)', value: 'sponsored nofollow noopener' },
                { label: 'nofollow noopener (Standard SEO nofollow)', value: 'nofollow noopener' },
                { label: 'noopener noreferrer (Standard external link)', value: 'noopener noreferrer' },
                { label: 'dofollow (Passes SEO authority)', value: 'dofollow' }
              ],
              help: __( 'Google Search Guidelines recommend rel="sponsored" for commercial & affiliate links.', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { linkRel: val } ); }
            } )
          )
        ),

        // Main Editor Canvas
        el(
          'div',
          blockProps,
          el(
            'div',
            { className: 'iptv-container' },

            // Header Preview
            el(
              'div',
              { className: 'iptv-header' },
              badge ? el( 'span', { className: 'iptv-badge' }, badge ) : null,
              title ? el( headingTag, { className: 'iptv-title' }, title ) : null,
              subtitle ? el( 'p', { className: 'iptv-subtitle' }, subtitle ) : null
            ),

            // Filters Section Preview
            el(
              'div',
              { className: 'iptv-filters' },

              // Level 1: M3U vs MAG Switcher
              el(
                'div',
                { className: 'iptv-conn-switcher' },
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'iptv-conn-btn' + ( activeConn === 'M3U' ? ' is-active' : '' ),
                    onClick: function() {
                      setActiveConn( 'M3U' );
                      setCurrentSlide( 0 );
                    }
                  },
                  m3uTabLabel
                ),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'iptv-conn-btn' + ( activeConn === 'MAG' ? ' is-active' : '' ),
                    onClick: function() {
                      setActiveConn( 'MAG' );
                      setCurrentSlide( 0 );
                    }
                  },
                  magTabLabel
                )
              ),

              // Level 2: Device Filter Pills
              el(
                'div',
                { className: 'iptv-device-selector' },
                availableDevices.map( function( dev ) {
                  return el(
                    'button',
                    {
                      key: dev,
                      type: 'button',
                      className: 'iptv-device-btn' + ( dev === effectiveDevice ? ' is-active' : '' ),
                      onClick: function() {
                        setActiveDevice( dev );
                        setCurrentSlide( 0 );
                      }
                    },
                    dev + ( dev === 1 ? ' Device' : ' Devices' )
                  );
                } )
              )
            ),

            // Packages Cards Track Preview
            el(
              'div',
              { className: 'iptv-grid-wrapper' },

              // Carousel Nav Arrows in Editor
              isCarousel ? el(
                'button',
                {
                  type: 'button',
                  className: 'iptv-carousel-nav is-prev' + ( currentSlide <= 0 ? ' is-disabled' : '' ),
                  disabled: currentSlide <= 0,
                  onClick: function() {
                    if ( currentSlide > 0 ) setCurrentSlide( currentSlide - 1 );
                  }
                },
                '‹'
              ) : null,
              isCarousel ? el(
                'button',
                {
                  type: 'button',
                  className: 'iptv-carousel-nav is-next' + ( currentSlide >= maxSlide ? ' is-disabled' : '' ),
                  disabled: currentSlide >= maxSlide,
                  onClick: function() {
                    if ( currentSlide < maxSlide ) setCurrentSlide( currentSlide + 1 );
                  }
                },
                '›'
              ) : null,

              el(
                'div',
                { className: 'iptv-cards-viewport' },
                el(
                  'div',
                  {
                    className: 'iptv-cards-track' + ( isCarousel ? '' : ' is-grid' ),
                    style: isCarousel ? {
                      transform: 'translateX(-' + ( currentSlide * ( 100 / visibleCols ) ) + '%)'
                    } : null
                  },
                  filteredPackages.length === 0 ? el(
                    'div',
                    { style: { textAlign: 'center', padding: '30px', color: textColor } },
                    __( 'No packages found for this selection.', 'my-custom-plugin' )
                  ) : filteredPackages.map( function( pkg, idx ) {
                    var pkgName = pkg.name || ( ( pkg.months || 1 ) + ' Months' );
                    var durationText = pkg.hours && ! pkg.months ? ( pkg.hours + ' Hours Access' ) : ( ( ( pkg.months || 1 ) * 30 ) + ' Days' );
                    var feats = Array.isArray( pkg.features ) && pkg.features.length ? pkg.features : [
                      '15,000+ Live TV Channels',
                      '1,30,000+ Movies',
                      '34,000+ Series',
                      'HD, FHD & 4K Channels',
                      'TV Guide (EPG)',
                      '100% Up-time',
                      '24/7 Support'
                    ];

                    return el(
                      'div',
                      {
                        key: pkg.id || idx,
                        className: 'iptv-card' + ( pkg.popular ? ' is-popular' : '' )
                      },
                      pkg.popular ? el( 'div', { className: 'iptv-popular-ribbon' }, 'Popular' ) : null,
                      el(
                        'div',
                        { className: 'iptv-card-header' },
                        el( cardHeadingTag, { className: 'iptv-card-title' }, pkgName ),
                        pkg.description ? el( 'p', { className: 'iptv-card-desc' }, pkg.description ) : null
                      ),
                      el(
                        'div',
                        { className: 'iptv-price-banner' },
                        el(
                          'div',
                          { className: 'iptv-price-val' },
                          el( 'span', { className: 'iptv-currency' }, currencySymbol ),
                          el( 'span', null, pkg.price != null ? pkg.price : '0' )
                        ),
                        el( 'div', { className: 'iptv-duration-label' }, durationText )
                      ),
                      el(
                        'ul',
                        { className: 'iptv-features' },
                        feats.map( function( fText, fIdx ) {
                          return el(
                            'li',
                            { key: fIdx, className: 'iptv-feature-item' },
                            el(
                              'svg',
                              { className: 'iptv-check-icon', viewBox: '0 0 20 20', fill: 'currentColor' },
                              el( 'path', {
                                fillRule: 'evenodd',
                                d: 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z',
                                clipRule: 'evenodd'
                              } )
                            ),
                            el( 'span', null, fText )
                          );
                        } )
                      ),
                      el(
                        'div',
                        { className: 'iptv-card-footer' },
                        el( 'a', { className: 'iptv-btn-order', href: '#' }, buttonText ),
                        deliveryBadge ? el( 'div', { className: 'iptv-delivery-note' }, deliveryBadge ) : null
                      )
                    );
                  } )
                )
              ),

              // Carousel Dots Preview
              isCarousel && dotsElements.length > 0 ? el(
                'div',
                { className: 'iptv-carousel-dots' },
                dotsElements
              ) : null
            )
          )
        ),

        // Raw JSON Editor Modal
        isJsonModalOpen ? el(
          Modal,
          {
            title: __( 'Edit Packages Raw JSON', 'my-custom-plugin' ),
            onRequestClose: function() { setIsJsonModalOpen( false ); }
          },
          el( TextareaControl, {
            value: rawJson,
            rows: 16,
            help: __( 'Paste or edit array of packages JSON.', 'my-custom-plugin' ),
            onChange: function( val ) { setRawJson( val ); }
          } ),
          el(
            'div',
            { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' } },
            el( Button, {
              variant: 'secondary',
              onClick: function() { setIsJsonModalOpen( false ); }
            }, __( 'Cancel', 'my-custom-plugin' ) ),
            el( Button, {
              variant: 'primary',
              onClick: function() {
                try {
                  var parsed = JSON.parse( rawJson );
                  if ( Array.isArray( parsed ) ) {
                    setAttributes( { packages: parsed } );
                    setIsJsonModalOpen( false );
                  } else {
                    alert( __( 'JSON must be an array of package objects.', 'my-custom-plugin' ) );
                  }
                } catch ( err ) {
                  alert( __( 'Invalid JSON format: ', 'my-custom-plugin' ) + err.message );
                }
              }
            }, __( 'Save Packages', 'my-custom-plugin' ) )
          )
        ) : null
      );
    },

    save: function() {
      // Dynamic block rendered via render.php
      return null;
    }
  } );
} )( window.wp );
