( function( wp ) {
  var el = wp.element.createElement;
  var useEffect = wp.element.useEffect;
  var registerBlockType = wp.blocks.registerBlockType;
  var blockEditor = wp.blockEditor;
  var useBlockProps = blockEditor.useBlockProps;
  var RichText = blockEditor.RichText;
  var InspectorControls = blockEditor.InspectorControls;
  var components = wp.components;
  var PanelBody = components.PanelBody;
  var RangeControl = components.RangeControl;
  var ToggleControl = components.ToggleControl;
  var TextControl = components.TextControl;
  var ColorPalette = components.ColorPalette;
  var Button = components.Button;
  var useSelect = wp.data.useSelect;
  var __ = wp.i18n.__;

  var LINK_COLORS = [
    { name: 'Purple (Default)', color: '#7c3aed' },
    { name: 'Deep Violet', color: '#6d28d9' },
    { name: 'Primary Blue', color: '#2563eb' },
    { name: 'Emerald Green', color: '#059669' },
    { name: 'Amber Orange', color: '#d97706' },
    { name: 'Ruby Red', color: '#dc2626' },
    { name: 'Dark Slate', color: '#0f172a' }
  ];

  registerBlockType( 'my-custom-plugin/table-of-contents', {
    edit: function( props ) {
      var attributes = props.attributes;
      var setAttributes = props.setAttributes;
      var title = attributes.title || '📋 In This Guide';
      var columns = attributes.columns || 2;
      var linkColor = attributes.linkColor || '#7c3aed';
      var includeH2 = attributes.includeH2 !== undefined ? attributes.includeH2 : true;
      var includeH3 = attributes.includeH3 !== undefined ? attributes.includeH3 : true;
      var includeH4 = attributes.includeH4 !== undefined ? attributes.includeH4 : false;
      var hiddenHeadings = attributes.hiddenHeadings || [];
      var customLabels = attributes.customLabels || {};
      var customLinks = attributes.customLinks || [];

      // Dynamically scan blocks in the blog post you are currently writing!
      var detectedHeadings = useSelect( function( select ) {
        var editor = select( 'core/block-editor' );
        if ( ! editor ) return [];

        var blocks = editor.getBlocks();
        var list = [];

        function scan( blockList ) {
          if ( ! blockList || ! blockList.length ) return;
          blockList.forEach( function( b ) {
            if ( b.name === 'core/heading' ) {
              var raw = ( b.attributes && b.attributes.content ) ? b.attributes.content : '';
              var text = raw.replace( /<[^>]+>/g, '' ).trim();
              var level = ( b.attributes && b.attributes.level ) ? b.attributes.level : 2;
              var anchor = ( b.attributes && b.attributes.anchor ) ? b.attributes.anchor : '';
              var id = anchor ? anchor : text.toLowerCase().replace( /[^\w\s-]/g, '' ).replace( /\s+/g, '-' );

              if ( text ) {
                list.push( { id: id, text: text, level: level } );
              }
            }
            if ( b.innerBlocks && b.innerBlocks.length ) {
              scan( b.innerBlocks );
            }
          } );
        }

        scan( blocks );
        return list;
      }, [] );

      var activeHeadings = detectedHeadings || [];

      // Sync active headings with block attributes for persistence
      useEffect( function() {
        var curr = JSON.stringify( attributes.headings || [] );
        var next = JSON.stringify( activeHeadings );
        if ( curr !== next ) {
          setAttributes( { headings: activeHeadings } );
        }
      }, [ activeHeadings ] );

      // Update custom label / link text for a heading
      function updateHeadingLabel( id, newText, defaultText ) {
        var newLabels = Object.assign( {}, customLabels );
        if ( newText && newText !== defaultText ) {
          newLabels[ id ] = newText;
        } else {
          delete newLabels[ id ];
        }
        setAttributes( { customLabels: newLabels } );
      }

      // Toggle individual heading visibility (Hide / Show)
      function toggleHeadingVisibility( id ) {
        var newHidden = [].concat( hiddenHeadings );
        var idx = newHidden.indexOf( id );
        if ( idx > -1 ) {
          newHidden.splice( idx, 1 ); // Show
        } else {
          newHidden.push( id ); // Hide
        }
        setAttributes( { hiddenHeadings: newHidden } );
      }

      // Add a manual custom link
      function addCustomLink() {
        var newLinks = [].concat( customLinks );
        newLinks.push( {
          text: __( 'Custom Link', 'my-custom-plugin' ),
          url: '#'
        } );
        setAttributes( { customLinks: newLinks } );
      }

      // Update custom link
      function updateCustomLink( index, field, value ) {
        var newLinks = JSON.parse( JSON.stringify( customLinks ) );
        if ( newLinks[ index ] ) {
          newLinks[ index ][ field ] = value;
          setAttributes( { customLinks: newLinks } );
        }
      }

      // Delete custom link
      function deleteCustomLink( index ) {
        var newLinks = [].concat( customLinks );
        newLinks.splice( index, 1 );
        setAttributes( { customLinks: newLinks } );
      }

      // Filter headings by selected levels and user visibility choices
      var visibleHeadings = activeHeadings.filter( function( h ) {
        if ( h.level === 2 && ! includeH2 ) return false;
        if ( h.level === 3 && ! includeH3 ) return false;
        if ( h.level === 4 && ! includeH4 ) return false;
        if ( hiddenHeadings.indexOf( h.id ) > -1 ) return false;
        return true;
      } );

      var blockProps = useBlockProps( {
        className: 'mcp-toc-container'
      } );

      return el(
        wp.element.Fragment,
        null,

        // Sidebar Inspector Controls
        el(
          InspectorControls,
          null,

          // Panel 1: Layout & Columns
          el(
            PanelBody,
            { title: __( 'TOC Layout & Columns', 'my-custom-plugin' ), initialOpen: true },
            el( RangeControl, {
              label: __( 'Number of Columns', 'my-custom-plugin' ),
              value: columns,
              min: 1,
              max: 4,
              onChange: function( val ) { setAttributes( { columns: val } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 6px' } }, __( 'Link Text Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: LINK_COLORS,
              value: linkColor,
              onChange: function( color ) { setAttributes( { linkColor: color || '#7c3aed' } ); }
            } )
          ),

          // Panel 2: Heading Levels Filter
          el(
            PanelBody,
            { title: __( 'Include Heading Levels', 'my-custom-plugin' ), initialOpen: false },
            el( ToggleControl, {
              label: __( 'Include H2 Headings', 'my-custom-plugin' ),
              checked: includeH2,
              onChange: function( val ) { setAttributes( { includeH2: val } ); }
            } ),
            el( ToggleControl, {
              label: __( 'Include H3 Headings', 'my-custom-plugin' ),
              checked: includeH3,
              onChange: function( val ) { setAttributes( { includeH3: val } ); }
            } ),
            el( ToggleControl, {
              label: __( 'Include H4 Headings', 'my-custom-plugin' ),
              checked: includeH4,
              onChange: function( val ) { setAttributes( { includeH4: val } ); }
            } )
          ),

          // Panel 3: Individual Headings Visibility & Custom Link Text
          el(
            PanelBody,
            {
              title: __( 'Manage Headings & Link Text', 'my-custom-plugin' ) + ' (' + activeHeadings.length + ')',
              initialOpen: true
            },
            activeHeadings.length === 0 ? el(
              'p',
              { style: { fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: 0 } },
              __( 'No headings detected in this blog post yet. Add some Heading blocks to your post to customize their link text and visibility here.', 'my-custom-plugin' )
            ) : el(
              wp.element.Fragment,
              null,
              el( 'p', { style: { fontSize: '12px', color: '#64748b', margin: '0 0 10px' } },
                __( 'You can customize each link text or hide headings:', 'my-custom-plugin' )
              ),
              activeHeadings.map( function( h, i ) {
                var isVisible = hiddenHeadings.indexOf( h.id ) === -1;
                var currentText = customLabels[ h.id ] || h.text;
                var isCustomized = !!customLabels[ h.id ];

                return el(
                  'div',
                  {
                    key: h.id + '-' + i,
                    style: {
                      padding: '8px 0',
                      borderBottom: '1px solid #f1f5f9',
                      opacity: isVisible ? 1 : 0.5
                    }
                  },
                  el( 'div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' } },
                    el( 'span', { style: { fontSize: '12px', fontWeight: 600 } },
                      el( 'span', { className: 'mcp-toc-heading-level-tag' }, 'H' + h.level ),
                      h.text
                    ),
                    el( Button, {
                      isSmall: true,
                      variant: isVisible ? 'primary' : 'secondary',
                      onClick: function() { toggleHeadingVisibility( h.id ); }
                    }, isVisible ? __( 'Visible', 'my-custom-plugin' ) : __( 'Hidden', 'my-custom-plugin' ) )
                  ),
                  isVisible && el(
                    'div',
                    { style: { display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' } },
                    el( TextControl, {
                      label: __( 'Link Text:', 'my-custom-plugin' ),
                      hideLabelFromVision: true,
                      value: currentText,
                      placeholder: h.text,
                      onChange: function( val ) { updateHeadingLabel( h.id, val, h.text ); }
                    } ),
                    isCustomized && el( Button, {
                      isSmall: true,
                      variant: 'tertiary',
                      onClick: function() { updateHeadingLabel( h.id, '', h.text ); }
                    }, __( 'Reset', 'my-custom-plugin' ) )
                  )
                );
              } ),
              hiddenHeadings.length > 0 && el( Button, {
                variant: 'secondary',
                isSmall: true,
                style: { marginTop: '12px', width: '100%', justifyContent: 'center' },
                onClick: function() { setAttributes( { hiddenHeadings: [] } ); }
              }, __( 'Show All Headings', 'my-custom-plugin' ) )
            )
          ),

          // Panel 4: Manual Custom Links
          el(
            PanelBody,
            { title: __( 'Manual Custom Links', 'my-custom-plugin' ) + ' (' + customLinks.length + ')', initialOpen: false },
            el( 'p', { style: { fontSize: '12px', color: '#64748b', margin: '0 0 10px' } },
              __( 'Add extra links to the guide that are not blog headings (e.g. #faqs, #pricing, external links):', 'my-custom-plugin' )
            ),
            customLinks.map( function( cl, idx ) {
              return el(
                'div',
                { key: idx, style: { padding: '8px 0', borderBottom: '1px solid #f1f5f9' } },
                el( TextControl, {
                  label: __( 'Link Text', 'my-custom-plugin' ),
                  value: cl.text,
                  onChange: function( val ) { updateCustomLink( idx, 'text', val ); }
                } ),
                el( TextControl, {
                  label: __( 'Target URL or Anchor (#section)', 'my-custom-plugin' ),
                  value: cl.url,
                  onChange: function( val ) { updateCustomLink( idx, 'url', val ); }
                } ),
                el( Button, {
                  isDestructive: true,
                  isSmall: true,
                  variant: 'tertiary',
                  onClick: function() { deleteCustomLink( idx ); }
                }, __( 'Remove Link', 'my-custom-plugin' ) )
              );
            } ),
            el( Button, {
              variant: 'secondary',
              isSmall: true,
              style: { marginTop: '10px', width: '100%', justifyContent: 'center' },
              onClick: addCustomLink
            }, '+ ' + __( 'Add Custom Link', 'my-custom-plugin' ) )
          )
        ),

        // Main In-Canvas Block
        el(
          'nav',
          blockProps,

          // Title
          el( RichText, {
            tagName: 'div',
            className: 'mcp-toc-title',
            value: title,
            placeholder: __( '📋 In This Guide', 'my-custom-plugin' ),
            onChange: function( val ) { setAttributes( { title: val } ); }
          } ),

          // Headings list
          ( visibleHeadings.length > 0 || customLinks.length > 0 ) ? el(
            'ul',
            {
              className: 'mcp-toc-list',
              style: {
                '--mcp-toc-cols': columns,
                '--mcp-toc-link-color': linkColor
              }
            },
            // Auto-detected blog headings (with click-to-edit link text!)
            visibleHeadings.map( function( h, idx ) {
              var displayText = customLabels[ h.id ] || h.text;

              return el(
                'li',
                { key: h.id + '-' + idx, className: 'mcp-toc-item' },
                el(
                  'span',
                  {
                    className: 'mcp-toc-link mcp-toc-link-editable',
                    style: { color: linkColor },
                    title: __( 'Click to edit link text directly', 'my-custom-plugin' )
                  },
                  el( RichText, {
                    tagName: 'span',
                    value: displayText,
                    placeholder: h.text,
                    onChange: function( newText ) {
                      updateHeadingLabel( h.id, newText, h.text );
                    }
                  } )
                )
              );
            } ),

            // Manual custom links
            customLinks.map( function( cl, idx ) {
              return el(
                'li',
                { key: 'custom-' + idx, className: 'mcp-toc-item' },
                el(
                  'span',
                  {
                    className: 'mcp-toc-link mcp-toc-link-editable',
                    style: { color: linkColor }
                  },
                  el( RichText, {
                    tagName: 'span',
                    value: cl.text,
                    placeholder: __( 'Custom Link Text', 'my-custom-plugin' ),
                    onChange: function( val ) { updateCustomLink( idx, 'text', val ); }
                  } )
                )
              );
            } )
          ) : el(
            'div',
            { className: 'mcp-toc-empty-hint' },
            el( 'p', { style: { margin: '0 0 4px', fontWeight: 600, color: '#0f172a' } },
              '✍️ ' + __( 'Auto-detecting blog headings...', 'my-custom-plugin' )
            ),
            el( 'p', { style: { margin: 0, fontSize: '13px', color: '#64748b' } },
              __( 'No headings detected in this post yet. As you write and add Heading (H2, H3) blocks anywhere in this blog, they will automatically appear here!', 'my-custom-plugin' )
            )
          ),

          // Canvas helper: Quick button to add custom links
          el(
            'div',
            { className: 'mcp-toc-footer-actions' },
            el( Button, {
              isSmall: true,
              variant: 'tertiary',
              onClick: addCustomLink
            }, '+ ' + __( 'Add Custom Link', 'my-custom-plugin' ) )
          )
        )
      );
    },

    // Dynamic block: Frontend rendering is handled dynamically by render.php
    save: function() {
      return null;
    }
  } );
} )( window.wp );
