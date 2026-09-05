( function( wp ) {
  var el = wp.element.createElement;
  var useState = wp.element.useState;
  var Fragment = wp.element.Fragment;
  var registerBlockType = wp.blocks.registerBlockType;
  var blockEditor = wp.blockEditor;
  var useBlockProps = blockEditor.useBlockProps;
  var RichText = blockEditor.RichText;
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
  var ButtonGroup = components.ButtonGroup;
  var __ = wp.i18n.__;

  // Preset style definitions
  var PRESETS = {
    'bordered-cards': {
      label: __( 'Modern Bordered Cards (Images 1 & 4)', 'my-custom-plugin' ),
      accentColor: '#2563eb',
      cardBgColor: '#ffffff',
      activeBgColor: '#ffffff',
      borderColor: '#e2e8f0',
      activeBorderColor: '#0284c7',
      borderRadius: 14,
      itemGap: 14,
      iconStyle: 'circle-arrow'
    },
    'elevated-cards': {
      label: __( 'Elevated Floating Cards (Image 2)', 'my-custom-plugin' ),
      accentColor: '#1d4ed8',
      cardBgColor: '#ffffff',
      activeBgColor: '#ffffff',
      borderColor: 'transparent',
      activeBorderColor: 'transparent',
      borderRadius: 12,
      itemGap: 16,
      iconStyle: 'chevron'
    },
    'grouped-bordered': {
      label: __( 'Minimalist Grouped Dividers (Image 3)', 'my-custom-plugin' ),
      accentColor: '#0f172a',
      cardBgColor: '#ffffff',
      activeBgColor: '#ffffff',
      borderColor: '#e2e8f0',
      activeBorderColor: '#e2e8f0',
      borderRadius: 8,
      itemGap: 0,
      iconStyle: 'chevron'
    },
    'soft-tint': {
      label: __( 'Soft Pill / Tinted Cards', 'my-custom-plugin' ),
      accentColor: '#059669',
      cardBgColor: '#f8fafc',
      activeBgColor: '#f0fdf4',
      borderColor: '#e2e8f0',
      activeBorderColor: '#10b981',
      borderRadius: 16,
      itemGap: 14,
      iconStyle: 'circle-arrow'
    }
  };

  var DEFAULT_ANSWERS = {
    'What payment methods do you accept?': 'We accept all major credit and debit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and secure bank transfers.',
    'Can I change my plan later?': 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and any remaining balance is automatically prorated.',
    'Is there a refund policy?': 'Yes! We offer an unconditional 30-day money-back guarantee. If you\'re not completely satisfied, simply reach out to our support team for a full refund.',
    'Is it possible to modify my subscription later?': 'Absolutely. You can update billing details, change renewal frequencies, or pause your subscription directly from your customer dashboard at any time.'
  };

  // Helper to render icon markup
  function renderIconElement( style, isOpen ) {
    if ( style === 'circle-arrow' ) {
      return el(
        'span',
        { className: 'mcp-faq-icon mcp-icon-circle-arrow' },
        el(
          'svg',
          {
            viewBox: '0 0 24 24',
            width: '16',
            height: '16',
            stroke: 'currentColor',
            strokeWidth: '2.5',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            className: 'mcp-chevron-svg'
          },
          el( 'polyline', { points: '6 9 12 15 18 9' } )
        )
      );
    } else if ( style === 'plus-minus' ) {
      return el(
        'span',
        { className: 'mcp-faq-icon mcp-icon-plusminus' },
        el(
          'svg',
          {
            viewBox: '0 0 24 24',
            width: '18',
            height: '18',
            stroke: 'currentColor',
            strokeWidth: '2.5',
            fill: 'none',
            strokeLinecap: 'round',
            className: 'mcp-plus-svg'
          },
          el( 'line', { x1: '12', y1: '5', x2: '12', y2: '19', className: 'mcp-line-vertical' } ),
          el( 'line', { x1: '5', y1: '12', x2: '19', y2: '12' } )
        )
      );
    } else {
      // Default: clean chevron
      return el(
        'span',
        { className: 'mcp-faq-icon mcp-icon-chevron' },
        el(
          'svg',
          {
            viewBox: '0 0 24 24',
            width: '20',
            height: '20',
            stroke: 'currentColor',
            strokeWidth: '2.5',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            className: 'mcp-chevron-svg'
          },
          el( 'polyline', { points: '6 9 12 15 18 9' } )
        )
      );
    }
  }

  registerBlockType( 'my-custom-plugin/faq', {
    edit: function( props ) {
      var attributes = props.attributes;
      var setAttributes = props.setAttributes;

      var items = attributes.items || [];
      var stylePreset = attributes.stylePreset || 'bordered-cards';
      var showHeading = attributes.showHeading !== undefined ? attributes.showHeading : true;
      var heading = attributes.heading || '';
      var headingTag = attributes.headingTag || 'h2';
      var subheading = attributes.subheading || '';
      var headingAlign = attributes.headingAlign || 'center';
      var iconStyle = attributes.iconStyle || 'circle-arrow';
      var iconPosition = attributes.iconPosition || 'right';
      var showNumbering = attributes.showNumbering !== undefined ? attributes.showNumbering : false;
      var accentColor = attributes.accentColor || '#2563eb';
      var activeBorderColor = attributes.activeBorderColor || '#2563eb';
      var activeBgColor = attributes.activeBgColor || '#ffffff';
      var cardBgColor = attributes.cardBgColor || '#ffffff';
      var borderColor = attributes.borderColor || '#e2e8f0';
      var titleColor = attributes.titleColor || '#0f172a';
      var contentColor = attributes.contentColor || '#475569';
      var borderRadius = attributes.borderRadius !== undefined ? attributes.borderRadius : 14;
      var itemGap = attributes.itemGap !== undefined ? attributes.itemGap : 14;
      var behavior = attributes.behavior || 'accordion';
      var initialState = attributes.initialState || 'first-open';
      var enableSchema = attributes.enableSchema !== undefined ? attributes.enableSchema : true;

      // Editor state: which items are expanded in the editor for writing/editing answers.
      // Default: ALL items are expanded so answers are immediately visible and impossible to miss!
      var expandedState = useState( function() {
        var all = [];
        for ( var i = 0; i < items.length; i++ ) {
          all.push( i );
        }
        return all;
      } );
      var expandedIndexes = expandedState[ 0 ];
      var setExpandedIndexes = expandedState[ 1 ];

      function toggleEditorExpand( idx ) {
        if ( expandedIndexes.indexOf( idx ) !== -1 ) {
          setExpandedIndexes( expandedIndexes.filter( function( i ) { return i !== idx; } ) );
        } else {
          setExpandedIndexes( expandedIndexes.concat( [ idx ] ) );
        }
      }

      function expandAllAnswers() {
        var all = [];
        for ( var i = 0; i < items.length; i++ ) {
          all.push( i );
        }
        setExpandedIndexes( all );
      }

      function collapseAllAnswers() {
        setExpandedIndexes( [] );
      }

      function updateItem( idx, field, val ) {
        var newItems = JSON.parse( JSON.stringify( items ) );
        if ( newItems[ idx ] ) {
          newItems[ idx ][ field ] = val;
          setAttributes( { items: newItems } );
        }
      }

      function addItem() {
        var newItems = JSON.parse( JSON.stringify( items ) );
        var newIndex = newItems.length;
        newItems.push( {
          id: 'faq-' + Date.now(),
          question: 'Write your new question here...',
          answer: 'Write your answer here. You can add multiple paragraphs, links, bold text, or lists.',
          isOpen: false
        } );
        setAttributes( { items: newItems } );
        setExpandedIndexes( expandedIndexes.concat( [ newIndex ] ) );
      }

      function duplicateItem( idx, e ) {
        if ( e ) e.stopPropagation();
        var newItems = JSON.parse( JSON.stringify( items ) );
        var clone = JSON.parse( JSON.stringify( newItems[ idx ] ) );
        clone.id = 'faq-' + Date.now();
        clone.question = clone.question + ' (Copy)';
        newItems.splice( idx + 1, 0, clone );
        setAttributes( { items: newItems } );
        setExpandedIndexes( expandedIndexes.concat( [ idx + 1 ] ) );
      }

      function moveItem( idx, dir, e ) {
        if ( e ) e.stopPropagation();
        var target = idx + dir;
        if ( target < 0 || target >= items.length ) return;
        var newItems = JSON.parse( JSON.stringify( items ) );
        var temp = newItems[ idx ];
        newItems[ idx ] = newItems[ target ];
        newItems[ target ] = temp;
        setAttributes( { items: newItems } );
      }

      function deleteItem( idx, e ) {
        if ( e ) e.stopPropagation();
        if ( items.length <= 1 ) return;
        var newItems = JSON.parse( JSON.stringify( items ) );
        newItems.splice( idx, 1 );
        setAttributes( { items: newItems } );
        setExpandedIndexes( expandedIndexes.filter( function( i ) { return i !== idx; } ) );
      }

      function applyPreset( presetKey ) {
        var preset = PRESETS[ presetKey ];
        if ( ! preset ) return;
        setAttributes( {
          stylePreset: presetKey,
          accentColor: preset.accentColor,
          cardBgColor: preset.cardBgColor,
          activeBgColor: preset.activeBgColor,
          borderColor: preset.borderColor,
          activeBorderColor: preset.activeBorderColor,
          borderRadius: preset.borderRadius,
          itemGap: preset.itemGap,
          iconStyle: preset.iconStyle
        } );
      }

      var customStyles = {
        '--mcp-faq-accent': accentColor,
        '--mcp-faq-card-bg': cardBgColor,
        '--mcp-faq-active-bg': activeBgColor,
        '--mcp-faq-border-color': borderColor,
        '--mcp-faq-active-border': activeBorderColor,
        '--mcp-faq-title-color': titleColor,
        '--mcp-faq-content-color': contentColor,
        '--mcp-faq-radius': borderRadius + 'px',
        '--mcp-faq-gap': itemGap + 'px'
      };

      var blockProps = useBlockProps( {
        className: 'mcp-faq-wrapper mcp-faq-preset-' + stylePreset + ' mcp-icon-pos-' + iconPosition,
        style: customStyles
      } );

      return el(
        Fragment,
        null,
        el(
          InspectorControls,
          null,

          // Panel 1: Manage Questions & Answers (Direct Textarea Inputs!)
          el(
            PanelBody,
            { title: __( '📝 Questions & Answers Content', 'my-custom-plugin' ), initialOpen: true },
            el( 'p', { style: { color: '#64748b', fontSize: '12px', marginTop: 0, marginBottom: '14px' } },
              __( 'Quickly write and edit all your FAQ questions and answers below, or directly on the canvas.', 'my-custom-plugin' )
            ),
            items.map( function( item, index ) {
              var qText = item.question ? item.question.replace( /<[^>]+>/g, '' ) : '';
              var qTitle = ( index + 1 ) + '. ' + ( qText ? ( qText.length > 30 ? qText.substring( 0, 30 ) + '...' : qText ) : 'Question ' + ( index + 1 ) );

              var currentAnswer = ( item.answer !== undefined && item.answer !== '' ) ? item.answer : ( DEFAULT_ANSWERS[ item.question ] || '' );

              return el(
                PanelBody,
                {
                  key: item.id || index,
                  title: qTitle,
                  initialOpen: index === 0
                },
                el( TextControl, {
                  label: __( 'Question:', 'my-custom-plugin' ),
                  value: item.question || '',
                  onChange: function( val ) { updateItem( index, 'question', val ); }
                } ),
                el( TextareaControl, {
                  label: __( 'Answer:', 'my-custom-plugin' ),
                  help: __( 'Write your detailed answer.', 'my-custom-plugin' ),
                  value: currentAnswer,
                  rows: 4,
                  onChange: function( val ) { updateItem( index, 'answer', val ); }
                } ),
                el(
                  'div',
                  { style: { display: 'flex', gap: '8px', marginTop: '10px' } },
                  items.length > 1 && el(
                    Button,
                    {
                      isDestructive: true,
                      isSmall: true,
                      onClick: function( e ) { deleteItem( index, e ); }
                    },
                    __( 'Delete Question', 'my-custom-plugin' )
                  )
                )
              );
            } ),
            el(
              Button,
              {
                variant: 'primary',
                icon: 'plus',
                style: { width: '100%', justifyContent: 'center', marginTop: '14px', height: '36px' },
                onClick: addItem
              },
              __( '+ Add New FAQ Item', 'my-custom-plugin' )
            )
          ),

          // Panel 2: Preset Selection Panel
          el(
            PanelBody,
            { title: __( '🎨 Design Preset', 'my-custom-plugin' ), initialOpen: false },
            el( SelectControl, {
              label: __( 'Choose Style Preset', 'my-custom-plugin' ),
              value: stylePreset,
              options: [
                { label: PRESETS[ 'bordered-cards' ].label, value: 'bordered-cards' },
                { label: PRESETS[ 'elevated-cards' ].label, value: 'elevated-cards' },
                { label: PRESETS[ 'grouped-bordered' ].label, value: 'grouped-bordered' },
                { label: PRESETS[ 'soft-tint' ].label, value: 'soft-tint' }
              ],
              onChange: applyPreset
            } )
          ),

          // Panel 3: Header Settings Panel
          el(
            PanelBody,
            { title: __( 'Section Header Settings', 'my-custom-plugin' ), initialOpen: false },
            el( ToggleControl, {
              label: __( 'Show Header Section', 'my-custom-plugin' ),
              checked: showHeading,
              onChange: function( val ) { setAttributes( { showHeading: val } ); }
            } ),
            showHeading && el(
              Fragment,
              null,
              el( SelectControl, {
                label: __( 'Heading Tag', 'my-custom-plugin' ),
                value: headingTag,
                options: [
                  { label: 'H2 (Default)', value: 'h2' },
                  { label: 'H3', value: 'h3' },
                  { label: 'H4', value: 'h4' },
                  { label: 'DIV', value: 'div' }
                ],
                onChange: function( val ) { setAttributes( { headingTag: val } ); }
              } ),
              el( SelectControl, {
                label: __( 'Heading Alignment', 'my-custom-plugin' ),
                value: headingAlign,
                options: [
                  { label: __( 'Center', 'my-custom-plugin' ), value: 'center' },
                  { label: __( 'Left', 'my-custom-plugin' ), value: 'left' },
                  { label: __( 'Right', 'my-custom-plugin' ), value: 'right' }
                ],
                onChange: function( val ) { setAttributes( { headingAlign: val } ); }
              } )
            )
          ),

          // Panel 4: Accordion Behavior Panel
          el(
            PanelBody,
            { title: __( 'Accordion Behavior', 'my-custom-plugin' ), initialOpen: false },
            el( SelectControl, {
              label: __( 'Expansion Mode', 'my-custom-plugin' ),
              value: behavior,
              options: [
                { label: __( 'Classic Accordion (Single item open at once)', 'my-custom-plugin' ), value: 'accordion' },
                { label: __( 'Multi-Expand (Allow multiple items open)', 'my-custom-plugin' ), value: 'multiple' }
              ],
              onChange: function( val ) { setAttributes( { behavior: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Default Initial State', 'my-custom-plugin' ),
              value: initialState,
              options: [
                { label: __( 'First Item Open (Recommended)', 'my-custom-plugin' ), value: 'first-open' },
                { label: __( 'All Items Closed', 'my-custom-plugin' ), value: 'all-closed' },
                { label: __( 'All Items Expanded', 'my-custom-plugin' ), value: 'all-open' }
              ],
              onChange: function( val ) { setAttributes( { initialState: val } ); }
            } )
          ),

          // Panel 5: Icon & Layout Panel
          el(
            PanelBody,
            { title: __( 'Icon & Indicators', 'my-custom-plugin' ), initialOpen: false },
            el( SelectControl, {
              label: __( 'Icon Style', 'my-custom-plugin' ),
              value: iconStyle,
              options: [
                { label: __( 'Circle Button Chevron (Image 1)', 'my-custom-plugin' ), value: 'circle-arrow' },
                { label: __( 'Clean Chevron (Images 2 & 3)', 'my-custom-plugin' ), value: 'chevron' },
                { label: __( 'Plus / Minus (+ / −)', 'my-custom-plugin' ), value: 'plus-minus' }
              ],
              onChange: function( val ) { setAttributes( { iconStyle: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Icon Position', 'my-custom-plugin' ),
              value: iconPosition,
              options: [
                { label: __( 'Right (Default)', 'my-custom-plugin' ), value: 'right' },
                { label: __( 'Left (Icon at first)', 'my-custom-plugin' ), value: 'left' }
              ],
              onChange: function( val ) { setAttributes( { iconPosition: val } ); }
            } ),
            el( ToggleControl, {
              label: __( 'Show Question Numbering (Q1, Q2...)', 'my-custom-plugin' ),
              help: __( 'Toggle to display or hide the Q1, Q2, etc. badge before questions.', 'my-custom-plugin' ),
              checked: showNumbering,
              onChange: function( val ) { setAttributes( { showNumbering: val } ); }
            } )
          ),

          // Panel 6: Color & Design Customization Panel
          el(
            PanelBody,
            { title: __( 'Custom Styling & Colors', 'my-custom-plugin' ), initialOpen: false },
            el( 'p', { style: { fontWeight: 600, margin: '8px 0 4px' } }, __( 'Primary / Accent Color (Active State)', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: accentColor,
              onChange: function( c ) { setAttributes( { accentColor: c || '#2563eb' } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 4px' } }, __( 'Active Card Border Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: activeBorderColor,
              onChange: function( c ) { setAttributes( { activeBorderColor: c || '#2563eb' } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 4px' } }, __( 'Card Background Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: cardBgColor,
              onChange: function( c ) { setAttributes( { cardBgColor: c || '#ffffff' } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 4px' } }, __( 'Active Card Background Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: activeBgColor,
              onChange: function( c ) { setAttributes( { activeBgColor: c || '#ffffff' } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 4px' } }, __( 'Border Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: borderColor,
              onChange: function( c ) { setAttributes( { borderColor: c || '#e2e8f0' } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 4px' } }, __( 'Question Title Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: titleColor,
              onChange: function( c ) { setAttributes( { titleColor: c || '#0f172a' } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 4px' } }, __( 'Answer Text Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: contentColor,
              onChange: function( c ) { setAttributes( { contentColor: c || '#475569' } ); }
            } ),
            el( RangeControl, {
              label: __( 'Corner Radius (px)', 'my-custom-plugin' ),
              value: borderRadius,
              min: 0,
              max: 32,
              onChange: function( val ) { setAttributes( { borderRadius: val } ); }
            } ),
            stylePreset !== 'grouped-bordered' && el( RangeControl, {
              label: __( 'Item Spacing / Gap (px)', 'my-custom-plugin' ),
              value: itemGap,
              min: 0,
              max: 32,
              onChange: function( val ) { setAttributes( { itemGap: val } ); }
            } )
          ),

          // Panel 7: SEO & Schema Settings
          el(
            PanelBody,
            { title: __( 'SEO & Schema Markup', 'my-custom-plugin' ), initialOpen: false },
            el( ToggleControl, {
              label: __( 'Generate Google FAQPage Schema', 'my-custom-plugin' ),
              help: __( 'Automatically embeds JSON-LD FAQPage structured data for Google Search rich results.', 'my-custom-plugin' ),
              checked: enableSchema,
              onChange: function( val ) { setAttributes( { enableSchema: val } ); }
            } )
          )
        ),

        // Editor Canvas
        el(
          'div',
          blockProps,

          // Optional Header Section
          showHeading && el(
            'div',
            { className: 'mcp-faq-header mcp-align-' + headingAlign },
            el( RichText, {
              tagName: headingTag,
              className: 'mcp-faq-title',
              value: heading,
              placeholder: __( 'Frequently Asked Questions', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { heading: val } ); }
            } ),
            el( RichText, {
              tagName: 'p',
              className: 'mcp-faq-subtitle',
              value: subheading,
              placeholder: __( 'Quick answers to help you get the most out of our service.', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { subheading: val } ); }
            } )
          ),

          // Editor Toolbar: Expand / Collapse All Answers Helper
          el(
            'div',
            { className: 'mcp-faq-editor-toolbar' },
            el(
              'div',
              { className: 'mcp-editor-hint' },
              el( 'span', { className: 'mcp-hint-badge' }, __( 'FAQ Editor', 'my-custom-plugin' ) ),
              el( 'span', { className: 'mcp-hint-text' }, __( 'Click on any question or answer below to edit text directly.', 'my-custom-plugin' ) )
            ),
            el(
              ButtonGroup,
              null,
              el(
                Button,
                {
                  isSmall: true,
                  variant: expandedIndexes.length === items.length ? 'primary' : 'tertiary',
                  onClick: expandAllAnswers
                },
                __( 'Expand All Answers', 'my-custom-plugin' )
              ),
              el(
                Button,
                {
                  isSmall: true,
                  variant: expandedIndexes.length === 0 ? 'primary' : 'tertiary',
                  onClick: collapseAllAnswers
                },
                __( 'Collapse All', 'my-custom-plugin' )
              )
            )
          ),

          // List of FAQ Items
          el(
            'div',
            { className: 'mcp-faq-list' },
            items.map( function( item, index ) {
              var isExpanded = expandedIndexes.indexOf( index ) !== -1;
              var currentAnswer = ( item.answer !== undefined && item.answer !== '' ) ? item.answer : ( DEFAULT_ANSWERS[ item.question ] || '' );

              return el(
                'div',
                {
                  key: item.id || index,
                  className: 'mcp-faq-item' + ( isExpanded ? ' mcp-is-open mcp-editor-open' : '' )
                },

                // Item Header Bar (Question + Actions)
                el(
                  'div',
                  {
                    className: 'mcp-faq-trigger mcp-editor-trigger'
                  },
                  // 1. Icon on Left (at first!)
                  iconPosition === 'left' && el(
                    'div',
                    {
                      className: 'mcp-icon-wrap mcp-icon-left-wrap',
                      onClick: function( e ) {
                        e.stopPropagation();
                        toggleEditorExpand( index );
                      },
                      title: __( 'Toggle answer', 'my-custom-plugin' )
                    },
                    renderIconElement( iconStyle, isExpanded )
                  ),

                  // 2. Dynamic Question Badge (only if showNumbering is enabled!)
                  showNumbering && el( 'span', { className: 'mcp-badge-q' }, 'Q' + ( index + 1 ) ),

                  // 3. Question RichText Input
                  el(
                    'div',
                    { className: 'mcp-faq-question-wrap' },
                    el( RichText, {
                      tagName: 'span',
                      className: 'mcp-faq-question',
                      value: item.question,
                      placeholder: __( 'Enter question here...', 'my-custom-plugin' ),
                      onChange: function( val ) { updateItem( index, 'question', val ); }
                    } )
                  ),

                  // 4. Icon on Right (if iconPosition is right)
                  iconPosition === 'right' && el(
                    'div',
                    {
                      className: 'mcp-icon-wrap mcp-icon-right-wrap',
                      onClick: function( e ) {
                        e.stopPropagation();
                        toggleEditorExpand( index );
                      },
                      title: __( 'Toggle answer', 'my-custom-plugin' )
                    },
                    renderIconElement( iconStyle, isExpanded )
                  ),

                  // 5. Explicit Toggle Answer Button
                  el(
                    Button,
                    {
                      isSmall: true,
                      variant: isExpanded ? 'secondary' : 'primary',
                      className: 'mcp-btn-toggle-answer',
                      onClick: function( e ) {
                        e.stopPropagation();
                        toggleEditorExpand( index );
                      }
                    },
                    isExpanded ? __( '▲ Hide Answer', 'my-custom-plugin' ) : __( '▼ Edit Answer', 'my-custom-plugin' )
                  ),

                  // 6. Item Action Toolbars with crisp SVGs (Fixes empty boxes)
                  el(
                    'div',
                    {
                      className: 'mcp-item-actions',
                      onClick: function( e ) { e.stopPropagation(); }
                    },
                    index > 0 && el(
                      Button,
                      {
                        isSmall: true,
                        className: 'mcp-action-btn',
                        title: __( 'Move Up', 'my-custom-plugin' ),
                        onClick: function( e ) { moveItem( index, -1, e ); }
                      },
                      el(
                        'svg',
                        { viewBox: '0 0 24 24', width: '13', height: '13', stroke: 'currentColor', strokeWidth: '2.5', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' },
                        el( 'polyline', { points: '18 15 12 9 6 15' } )
                      )
                    ),
                    index < items.length - 1 && el(
                      Button,
                      {
                        isSmall: true,
                        className: 'mcp-action-btn',
                        title: __( 'Move Down', 'my-custom-plugin' ),
                        onClick: function( e ) { moveItem( index, 1, e ); }
                      },
                      el(
                        'svg',
                        { viewBox: '0 0 24 24', width: '13', height: '13', stroke: 'currentColor', strokeWidth: '2.5', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' },
                        el( 'polyline', { points: '6 9 12 15 18 9' } )
                      )
                    ),
                    el(
                      Button,
                      {
                        isSmall: true,
                        className: 'mcp-action-btn',
                        title: __( 'Duplicate Question', 'my-custom-plugin' ),
                        onClick: function( e ) { duplicateItem( index, e ); }
                      },
                      el(
                        'svg',
                        { viewBox: '0 0 24 24', width: '13', height: '13', stroke: 'currentColor', strokeWidth: '2', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' },
                        el( 'rect', { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' } ),
                        el( 'path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' } )
                      )
                    ),
                    items.length > 1 && el(
                      Button,
                      {
                        isSmall: true,
                        className: 'mcp-action-btn mcp-action-delete',
                        title: __( 'Delete Question', 'my-custom-plugin' ),
                        onClick: function( e ) { deleteItem( index, e ); }
                      },
                      el(
                        'svg',
                        { viewBox: '0 0 24 24', width: '13', height: '13', stroke: 'currentColor', strokeWidth: '2', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' },
                        el( 'polyline', { points: '3 6 5 6 21 6' } ),
                        el( 'path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' } )
                      )
                    )
                  )
                ),

                // Item Answer Section (Prominent, with clear Answer header label!)
                isExpanded && el(
                  'div',
                  { className: 'mcp-faq-content-editor' },
                  el(
                    'div',
                    { className: 'mcp-faq-answer-meta-bar' },
                    el( 'span', { className: 'mcp-badge-a' }, __( '💬 Answer Content:', 'my-custom-plugin' ) ),
                    el( 'span', { className: 'mcp-answer-help-text' }, __( '(Type below • Supports bold, links, lists, and multi-paragraph answers)', 'my-custom-plugin' ) )
                  ),
                  el(
                    'div',
                    { className: 'mcp-faq-answer-input-box' },
                    el( RichText, {
                      tagName: 'div',
                      className: 'mcp-faq-answer',
                      value: currentAnswer,
                      placeholder: __( 'Write your detailed answer here... Click to type!', 'my-custom-plugin' ),
                      onChange: function( val ) { updateItem( index, 'answer', val ); }
                    } )
                  )
                )
              );
            } )
          ),

          // Add FAQ Item Button
          el(
            'div',
            { className: 'mcp-faq-editor-add-bar' },
            el(
              Button,
              {
                variant: 'primary',
                icon: 'plus',
                className: 'mcp-faq-add-btn',
                onClick: addItem
              },
              __( '+ Add Another FAQ Question', 'my-custom-plugin' )
            )
          )
        )
      );
    },

    save: function( props ) {
      var attributes = props.attributes;
      var items = attributes.items || [];
      var stylePreset = attributes.stylePreset || 'bordered-cards';
      var showHeading = attributes.showHeading !== undefined ? attributes.showHeading : true;
      var heading = attributes.heading || '';
      var headingTag = attributes.headingTag || 'h2';
      var subheading = attributes.subheading || '';
      var headingAlign = attributes.headingAlign || 'center';
      var iconStyle = attributes.iconStyle || 'circle-arrow';
      var iconPosition = attributes.iconPosition || 'right';
      var showNumbering = attributes.showNumbering !== undefined ? attributes.showNumbering : false;
      var accentColor = attributes.accentColor || '#2563eb';
      var activeBorderColor = attributes.activeBorderColor || '#2563eb';
      var activeBgColor = attributes.activeBgColor || '#ffffff';
      var cardBgColor = attributes.cardBgColor || '#ffffff';
      var borderColor = attributes.borderColor || '#e2e8f0';
      var titleColor = attributes.titleColor || '#0f172a';
      var contentColor = attributes.contentColor || '#475569';
      var borderRadius = attributes.borderRadius !== undefined ? attributes.borderRadius : 14;
      var itemGap = attributes.itemGap !== undefined ? attributes.itemGap : 14;
      var behavior = attributes.behavior || 'accordion';
      var initialState = attributes.initialState || 'first-open';
      var enableSchema = attributes.enableSchema !== undefined ? attributes.enableSchema : true;

      var customStyles = {
        '--mcp-faq-accent': accentColor,
        '--mcp-faq-card-bg': cardBgColor,
        '--mcp-faq-active-bg': activeBgColor,
        '--mcp-faq-border-color': borderColor,
        '--mcp-faq-active-border': activeBorderColor,
        '--mcp-faq-title-color': titleColor,
        '--mcp-faq-content-color': contentColor,
        '--mcp-faq-radius': borderRadius + 'px',
        '--mcp-faq-gap': itemGap + 'px'
      };

      var blockProps = useBlockProps.save( {
        className: 'mcp-faq-wrapper mcp-faq-preset-' + stylePreset + ' mcp-icon-pos-' + iconPosition,
        style: customStyles
      } );

      // JSON-LD Schema generation for SEO
      var schemaData = null;
      if ( enableSchema && items.length > 0 ) {
        var mainEntity = items.map( function( item ) {
          var cleanQuestion = item.question ? item.question.replace( /<[^>]+>/g, '' ) : '';
          var rawAnswer = ( item.answer !== undefined && item.answer !== '' ) ? item.answer : ( DEFAULT_ANSWERS[ item.question ] || '' );
          var cleanAnswer = rawAnswer ? rawAnswer.replace( /<[^>]+>/g, '' ) : '';
          return {
            '@type': 'Question',
            'name': cleanQuestion,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': cleanAnswer
            }
          };
        } );

        schemaData = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': mainEntity
        };
      }

      return el(
        'div',
        Object.assign( {}, blockProps, {
          'data-behavior': behavior,
          'data-initial': initialState
        } ),

        // Section Header
        showHeading && el(
          'div',
          { className: 'mcp-faq-header mcp-align-' + headingAlign },
          heading && el( RichText.Content, {
            tagName: headingTag,
            className: 'mcp-faq-title',
            value: heading
          } ),
          subheading && el( RichText.Content, {
            tagName: 'p',
            className: 'mcp-faq-subtitle',
            value: subheading
          } )
        ),

        // List of FAQ Items
        el(
          'div',
          { className: 'mcp-faq-list' },
          items.map( function( item, index ) {
            var itemId = ( item.id || ( 'faq-item-' + index ) );
            var headerId = 'header-' + itemId;
            var contentId = 'content-' + itemId;

            return el(
              'div',
              {
                key: itemId,
                className: 'mcp-faq-item',
                'data-index': index
              },
              el(
                'button',
                {
                  type: 'button',
                  className: 'mcp-faq-trigger',
                  'aria-expanded': 'false',
                  'aria-controls': contentId,
                  id: headerId
                },
                iconPosition === 'left' && renderIconElement( iconStyle, false ),
                showNumbering && el(
                  'span',
                  { className: 'mcp-badge-q' },
                  'Q' + ( index + 1 )
                ),
                el(
                  'span',
                  { className: 'mcp-faq-question' },
                  el( RichText.Content, {
                    tagName: 'span',
                    value: item.question
                  } )
                ),
                iconPosition === 'right' && renderIconElement( iconStyle, false )
              ),
              el(
                'div',
                {
                  className: 'mcp-faq-collapse',
                  id: contentId,
                  role: 'region',
                  'aria-labelledby': headerId
                },
                el(
                  'div',
                  { className: 'mcp-faq-collapse-inner' },
                  el( RichText.Content, {
                    tagName: 'div',
                    className: 'mcp-faq-answer',
                    value: ( item.answer !== undefined && item.answer !== '' ) ? item.answer : ( DEFAULT_ANSWERS[ item.question ] || '' )
                  } )
                )
              )
            );
          } )
        ),

        // Google FAQPage Schema.org Script
        schemaData && el( 'script', {
          type: 'application/ld+json',
          dangerouslySetInnerHTML: {
            __html: JSON.stringify( schemaData )
          }
        } )
      );
    }
  } );
} )( window.wp );
