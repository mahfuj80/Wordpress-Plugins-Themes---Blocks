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
  var ToggleControl = components.ToggleControl;
  var SelectControl = components.SelectControl;
  var TextControl = components.TextControl;
  var RangeControl = components.RangeControl;
  var ColorPalette = components.ColorPalette;
  var Button = components.Button;
  var Modal = components.Modal;
  var __ = wp.i18n.__;

  // Preset Color Palettes
  var PRESET_PALETTES = [
    { name: 'Rose Blush', color: '#d45b70' },
    { name: 'Primary Blue', color: '#2563eb' },
    { name: 'Emerald Green', color: '#059669' },
    { name: 'Slate Dark', color: '#0f172a' },
    { name: 'Indigo Accent', color: '#6366f1' },
    { name: 'Pure White', color: '#ffffff' },
    { name: 'Light Pink Bg', color: '#fff5f7' },
    { name: 'Soft Gray Bg', color: '#f8fafc' }
  ];

  // Helper: Render SVG Checkmark
  function renderCheckSvg() {
    return el(
      'svg',
      { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' },
      el( 'path', {
        d: 'M5 13l4 4L19 7',
        strokeWidth: '2.5',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      } )
    );
  }

  // Helper: Render SVG Cross
  function renderCrossSvg() {
    return el(
      'svg',
      { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' },
      el( 'path', {
        d: 'M6 18L18 6M6 6l12 12',
        strokeWidth: '2.5',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      } )
    );
  }

  // Helper: Render SVG Star
  function renderStarSvg() {
    return el(
      'svg',
      { viewBox: '0 0 20 20', fill: 'currentColor' },
      el( 'path', {
        d: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'
      } )
    );
  }

  registerBlockType( 'my-custom-plugin/comparison-chart', {
    edit: function( props ) {
      var attributes = props.attributes;
      var setAttributes = props.setAttributes;

      var themePreset = attributes.themePreset || 'blush';
      var title = attributes.title || '';
      var subtitle = attributes.subtitle || '';
      var showTitle = attributes.showTitle;
      var showDiffToggle = attributes.showDiffToggle;
      var diffToggleText = attributes.diffToggleText || 'Highlight Differences';
      var stickyHeader = attributes.stickyHeader;
      var stickyFirstCol = attributes.stickyFirstCol;
      var showTopCta = attributes.showTopCta !== undefined ? attributes.showTopCta : true;
      var showBottomCta = attributes.showBottomCta;
      var highlightedColId = attributes.highlightedColId || '';
      var highlightBadge = attributes.highlightBadge || '🏆 Best Overall';
      var items = attributes.items || [];
      var rows = attributes.rows || [];
      var cellPadding = attributes.cellPadding || 'normal';
      var borderRadius = attributes.borderRadius !== undefined ? attributes.borderRadius : 14;

      // Header Layout & Style Controls
      var headerStyle = attributes.headerStyle || 'cards';
      var showHeaderSubtitles = attributes.showHeaderSubtitles !== undefined ? attributes.showHeaderSubtitles : true;
      var showHeaderPrices = attributes.showHeaderPrices !== undefined ? attributes.showHeaderPrices : true;
      var showHeaderBadges = attributes.showHeaderBadges !== undefined ? attributes.showHeaderBadges : true;
      var headerAlign = attributes.headerAlign || 'center';

      // Features & Criteria Top-Left Corner Controls
      var cornerLabel = attributes.cornerLabel !== undefined ? attributes.cornerLabel : 'Features & Criteria';
      var cornerSubtitle = attributes.cornerSubtitle || '';
      var cornerLayout = attributes.cornerLayout || 'standard';
      var cornerBadgeText = attributes.cornerBadgeText || 'Overview';
      var cornerVAlign = attributes.cornerVAlign || 'middle';

      // Custom Color Overrides
      var primaryColor = attributes.primaryColor;
      var headerBgColor = attributes.headerBgColor;
      var headerTextColor = attributes.headerTextColor;
      var altRowBgColor = attributes.altRowBgColor;
      var borderColor = attributes.borderColor;

      // Active Tooltip Modal state: { isOpen: bool, rowIndex: number }
      var tooltipState = useState( { isOpen: false, rowIndex: -1 } );
      var tooltipModal = tooltipState[0];
      var setTooltipModal = tooltipState[1];

      // Active Link Edit Modal state: { isOpen: bool, colIndex: number }
      var linkModalState = useState( { isOpen: false, colIndex: -1 } );
      var linkModal = linkModalState[0];
      var setLinkModal = linkModalState[1];

      // Active Cell State: { rowId: string, colId: string }
      var activeCellState = useState( null );
      var activeCell = activeCellState[0];
      var setActiveCell = activeCellState[1];

      // --- HELPER FUNCTIONS ---

      // Update a column property
      function updateItem( index, field, value ) {
        var newItems = JSON.parse( JSON.stringify( items ) );
        if ( newItems[ index ] ) {
          newItems[ index ][ field ] = value;
          setAttributes( { items: newItems } );
        }
      }

      // Add a new product column
      function addColumn() {
        var newId = 'col-' + Date.now();
        var newCol = {
          id: newId,
          name: 'New Brand',
          subtitle: 'Product Tagline',
          price: '$99',
          pricePeriod: '/ item',
          badge: '',
          rating: 4.5,
          buttonText: 'Check Price',
          buttonUrl: '#',
          buttonNewTab: true,
          buttonSponsored: true
        };

        var newItems = items.concat( [ newCol ] );

        // Initialize cell values in all existing rows
        var newRows = rows.map( function( row ) {
          var r = JSON.parse( JSON.stringify( row ) );
          if ( ! r.isCategory ) {
            r.cells = r.cells || {};
            r.cells[ newId ] = { type: 'check', text: 'Yes' };
          }
          return r;
        } );

        setAttributes( { items: newItems, rows: newRows } );
      }

      // Delete a column
      function deleteColumn( index ) {
        if ( items.length <= 2 ) {
          alert( __( 'Comparison tables need at least 2 items to compare.', 'my-custom-plugin' ) );
          return;
        }
        var colId = items[ index ].id;
        var newItems = items.filter( function( _, i ) { return i !== index; } );

        var newHighlight = highlightedColId === colId ? ( newItems[0] ? newItems[0].id : '' ) : highlightedColId;

        var newRows = rows.map( function( row ) {
          var r = JSON.parse( JSON.stringify( row ) );
          if ( r.cells && r.cells[ colId ] ) {
            delete r.cells[ colId ];
          }
          return r;
        } );

        setAttributes( { items: newItems, rows: newRows, highlightedColId: newHighlight } );
      }

      // Move Column Left / Right
      function moveColumn( index, direction ) {
        var targetIndex = direction === 'left' ? index - 1 : index + 1;
        if ( targetIndex < 0 || targetIndex >= items.length ) return;

        var newItems = JSON.parse( JSON.stringify( items ) );
        var temp = newItems[ index ];
        newItems[ index ] = newItems[ targetIndex ];
        newItems[ targetIndex ] = temp;

        setAttributes( { items: newItems } );
      }

      // Add Feature Row
      function addRow() {
        var newId = 'row-' + Date.now();
        var initialCells = {};
        items.forEach( function( col ) {
          initialCells[ col.id ] = { type: 'check', text: 'Yes' };
        } );

        var newRow = {
          id: newId,
          isCategory: false,
          label: 'New Feature / Benefit',
          tooltip: '',
          cells: initialCells
        };

        setAttributes( { rows: rows.concat( [ newRow ] ) } );
      }

      // Add Category Section Header Row
      function addCategoryRow() {
        var newId = 'cat-' + Date.now();
        var newRow = {
          id: newId,
          isCategory: true,
          label: 'New Feature Category'
        };

        setAttributes( { rows: rows.concat( [ newRow ] ) } );
      }

      // Delete a Row
      function deleteRow( index ) {
        if ( rows.length <= 1 ) return;
        var newRows = rows.filter( function( _, i ) { return i !== index; } );
        setAttributes( { rows: newRows } );
      }

      // Move Row Up / Down
      function moveRow( index, direction ) {
        var targetIndex = direction === 'up' ? index - 1 : index + 1;
        if ( targetIndex < 0 || targetIndex >= rows.length ) return;

        var newRows = JSON.parse( JSON.stringify( rows ) );
        var temp = newRows[ index ];
        newRows[ index ] = newRows[ targetIndex ];
        newRows[ targetIndex ] = temp;

        setAttributes( { rows: newRows } );
      }

      // Update Row Label
      function updateRowLabel( index, value ) {
        var newRows = JSON.parse( JSON.stringify( rows ) );
        if ( newRows[ index ] ) {
          newRows[ index ].label = value;
          setAttributes( { rows: newRows } );
        }
      }

      // Update Row Tooltip
      function updateRowTooltip( index, value ) {
        var newRows = JSON.parse( JSON.stringify( rows ) );
        if ( newRows[ index ] ) {
          newRows[ index ].tooltip = value;
          setAttributes( { rows: newRows } );
        }
      }

      // Update Cell Type & Text
      function updateCell( rowId, colId, newType, newText, newRating ) {
        var newRows = rows.map( function( r ) {
          if ( r.id === rowId ) {
            var rowCopy = JSON.parse( JSON.stringify( r ) );
            rowCopy.cells = rowCopy.cells || {};
            var currentCell = rowCopy.cells[ colId ] || {};

            rowCopy.cells[ colId ] = {
              type: newType !== undefined ? newType : ( currentCell.type || 'check' ),
              text: newText !== undefined ? newText : ( currentCell.text || '' ),
              rating: newRating !== undefined ? newRating : ( currentCell.rating || 4.5 )
            };
            return rowCopy;
          }
          return r;
        } );

        setAttributes( { rows: newRows } );
      }

      // Helper: Render Column Actions Bar
      function renderColActions( colIdx, isWinner, item ) {
        return el(
          'div',
          { className: 'mcp-cc-col-actions' },
          el(
            'button',
            {
              type: 'button',
              className: 'mcp-cc-action-btn',
              title: __( 'Move Left', 'my-custom-plugin' ),
              onClick: function() { moveColumn( colIdx, 'left' ); }
            },
            '←'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'mcp-cc-action-btn is-winner' + ( isWinner ? ' active' : '' ),
              title: isWinner ? __( 'Featured Winner (Click to unset)', 'my-custom-plugin' ) : __( 'Set as Winner / Highlighted', 'my-custom-plugin' ),
              onClick: function() {
                setAttributes( { highlightedColId: isWinner ? '' : item.id } );
              }
            },
            '★'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'mcp-cc-action-btn',
              title: __( 'Move Right', 'my-custom-plugin' ),
              onClick: function() { moveColumn( colIdx, 'right' ); }
            },
            '→'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'mcp-cc-action-btn is-delete',
              title: __( 'Delete Column', 'my-custom-plugin' ),
              onClick: function() { deleteColumn( colIdx ); }
            },
            '×'
          )
        );
      }

      // Block Props & Styling
      var blockProps = useBlockProps( {
        className: 'mcp-comparison-chart-wrapper theme-' + themePreset + ' padding-' + cellPadding,
        style: {
          '--mcp-cc-radius': borderRadius + 'px',
          '--mcp-cc-primary': primaryColor || undefined,
          '--mcp-cc-header-bg': headerBgColor || undefined,
          '--mcp-cc-header-text': headerTextColor || undefined,
          '--mcp-cc-alt-bg': altRowBgColor || undefined,
          '--mcp-cc-border': borderColor || undefined
        }
      } );

      return el(
        Fragment,
        null,

        // ==========================================
        // SIDEBAR INSPECTOR CONTROLS
        // ==========================================
        el(
          InspectorControls,
          null,

          // 1. Header Design & Layout Modes
          el(
            PanelBody,
            { title: __( 'Header Layout & Styles', 'my-custom-plugin' ), initialOpen: true },
            el( SelectControl, {
              label: __( 'Header Layout Style', 'my-custom-plugin' ),
              value: headerStyle,
              options: [
                { label: '📝 Text Only (Classic & Minimalist)', value: 'text-only' },
                { label: '🏷️ Compact (Title + Price Pill)', value: 'compact' },
                { label: '📦 Rich Product Cards', value: 'cards' },
                { label: '💊 Floating Pill Boxes', value: 'pill-box' }
              ],
              onChange: function( val ) { setAttributes( { headerStyle: val } ); },
              help: __( 'Choose how column headers are styled. Text-Only provides a slim, clean header with no extra height.', 'my-custom-plugin' )
            } ),
            el( SelectControl, {
              label: __( 'Header Text Alignment', 'my-custom-plugin' ),
              value: headerAlign,
              options: [
                { label: 'Center', value: 'center' },
                { label: 'Left', value: 'left' }
              ],
              onChange: function( val ) { setAttributes( { headerAlign: val } ); }
            } ),
            headerStyle !== 'text-only' && el( ToggleControl, {
              label: __( 'Show Subtitles in Header', 'my-custom-plugin' ),
              checked: showHeaderSubtitles,
              onChange: function( val ) { setAttributes( { showHeaderSubtitles: val } ); }
            } ),
            headerStyle !== 'text-only' && el( ToggleControl, {
              label: __( 'Show Prices in Header', 'my-custom-plugin' ),
              checked: showHeaderPrices,
              onChange: function( val ) { setAttributes( { showHeaderPrices: val } ); }
            } ),
            headerStyle !== 'text-only' && el( ToggleControl, {
              label: __( 'Show Badges in Header', 'my-custom-plugin' ),
              checked: showHeaderBadges,
              onChange: function( val ) { setAttributes( { showHeaderBadges: val } ); }
            } ),
            headerStyle !== 'text-only' && el( ToggleControl, {
              label: __( 'Show Top CTA Buttons', 'my-custom-plugin' ),
              checked: showTopCta,
              onChange: function( val ) { setAttributes( { showTopCta: val } ); }
            } )
          ),

          // 2. Features & Criteria Corner Section (Top-Left Cell)
          el(
            PanelBody,
            { title: __( 'Features & Criteria Corner (Top-Left Cell)', 'my-custom-plugin' ), initialOpen: true },
            el( TextControl, {
              label: __( 'Corner Section Label', 'my-custom-plugin' ),
              value: cornerLabel,
              onChange: function( val ) { setAttributes( { cornerLabel: val } ); },
              help: __( 'Rename "Features & Criteria" to anything (e.g. "Brand Name", "Product", "Specifications").', 'my-custom-plugin' )
            } ),
            el( TextControl, {
              label: __( 'Corner Subtitle / Note', 'my-custom-plugin' ),
              value: cornerSubtitle,
              onChange: function( val ) { setAttributes( { cornerSubtitle: val } ); },
              help: __( 'Optional helper text (e.g. "Comparing 5 formulations").', 'my-custom-plugin' )
            } ),
            el( SelectControl, {
              label: __( 'Corner Layout Feature', 'my-custom-plugin' ),
              value: cornerLayout,
              options: [
                { label: 'Standard (Clean Label + Subtitle)', value: 'standard' },
                { label: 'Embed Difference Filter Here (NN/g)', value: 'filter-embed' },
                { label: 'Show Overview Badge (e.g. "Overview")', value: 'badge' }
              ],
              onChange: function( val ) { setAttributes( { cornerLayout: val } ); },
              help: __( 'Placing the Differences Toggle here fills the corner space with a smart command center!', 'my-custom-plugin' )
            } ),
            cornerLayout === 'badge' && el( TextControl, {
              label: __( 'Overview Badge Text', 'my-custom-plugin' ),
              value: cornerBadgeText,
              onChange: function( val ) { setAttributes( { cornerBadgeText: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Corner Vertical Alignment', 'my-custom-plugin' ),
              value: cornerVAlign,
              options: [
                { label: 'Middle (Balanced & Centered)', value: 'middle' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' }
              ],
              onChange: function( val ) { setAttributes( { cornerVAlign: val } ); },
              help: __( 'Middle alignment prevents empty white space above or below.', 'my-custom-plugin' )
            } )
          ),

          // 3. Theme Presets & Styling
          el(
            PanelBody,
            { title: __( 'Design & Theme Presets', 'my-custom-plugin' ), initialOpen: false },
            el( SelectControl, {
              label: __( 'Aesthetic Preset', 'my-custom-plugin' ),
              value: themePreset,
              options: [
                { label: '🌸 Blush & Beauty (Skincare Chart)', value: 'blush' },
                { label: '🚀 Modern SaaS (Indigo & Slate)', value: 'modern' },
                { label: '🌿 Clean Emerald (Eco / Health)', value: 'emerald' },
                { label: '🌙 Dark Luxe (Midnight Slate)', value: 'dark' },
                { label: '⚡ Minimalist (Editorial B&W)', value: 'minimal' }
              ],
              onChange: function( val ) { setAttributes( { themePreset: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Cell Padding Scale', 'my-custom-plugin' ),
              value: cellPadding,
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Normal (Balanced)', value: 'normal' },
                { label: 'Spacious (Roomy)', value: 'spacious' }
              ],
              onChange: function( val ) { setAttributes( { cellPadding: val } ); }
            } ),
            el( RangeControl, {
              label: __( 'Card Border Radius (px)', 'my-custom-plugin' ),
              value: borderRadius,
              onChange: function( val ) { setAttributes( { borderRadius: val } ); },
              min: 0,
              max: 28,
              step: 2
            } )
          ),

          // 4. NN/g Decision Making & UX Controls
          el(
            PanelBody,
            { title: __( 'NN/g Decision-Making UX', 'my-custom-plugin' ), initialOpen: false },
            el( ToggleControl, {
              label: __( 'Sticky Table Header', 'my-custom-plugin' ),
              checked: stickyHeader,
              onChange: function( val ) { setAttributes( { stickyHeader: val } ); }
            } ),
            el( ToggleControl, {
              label: __( 'Sticky Feature Column (Mobile)', 'my-custom-plugin' ),
              checked: stickyFirstCol,
              onChange: function( val ) { setAttributes( { stickyFirstCol: val } ); }
            } ),
            cornerLayout !== 'filter-embed' && el( ToggleControl, {
              label: __( 'Show "Highlight Differences" Toggle in Topbar', 'my-custom-plugin' ),
              checked: showDiffToggle,
              onChange: function( val ) { setAttributes( { showDiffToggle: val } ); }
            } ),
            el( TextControl, {
              label: __( 'Difference Filter Button Text', 'my-custom-plugin' ),
              value: diffToggleText,
              onChange: function( val ) { setAttributes( { diffToggleText: val } ); }
            } ),
            el( SelectControl, {
              label: __( 'Highlighted Winner Column', 'my-custom-plugin' ),
              value: highlightedColId,
              options: [ { label: __( 'None (Neutral)', 'my-custom-plugin' ), value: '' } ].concat(
                items.map( function( itm ) {
                  return { label: itm.name || 'Untitled Column', value: itm.id };
                } )
              ),
              onChange: function( val ) { setAttributes( { highlightedColId: val } ); }
            } ),
            highlightedColId && el( TextControl, {
              label: __( 'Winner Badge Text', 'my-custom-plugin' ),
              value: highlightBadge,
              onChange: function( val ) { setAttributes( { highlightBadge: val } ); }
            } )
          ),

          // 5. Conversion & Call to Action
          el(
            PanelBody,
            { title: __( 'Call to Action (CTA) Buttons', 'my-custom-plugin' ), initialOpen: false },
            el( ToggleControl, {
              label: __( 'Show Bottom CTA Row', 'my-custom-plugin' ),
              checked: showBottomCta,
              onChange: function( val ) { setAttributes( { showBottomCta: val } ); }
            } )
          ),

          // 6. Custom Colors
          el(
            PanelBody,
            { title: __( 'Custom Colors Override', 'my-custom-plugin' ), initialOpen: false },
            el( 'p', { className: 'components-base-control__label' }, __( 'Primary / Accent Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: PRESET_PALETTES,
              value: primaryColor,
              onChange: function( val ) { setAttributes( { primaryColor: val || '' } ); }
            } ),
            el( 'p', { className: 'components-base-control__label' }, __( 'Header Background', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: PRESET_PALETTES,
              value: headerBgColor,
              onChange: function( val ) { setAttributes( { headerBgColor: val || '' } ); }
            } ),
            el( 'p', { className: 'components-base-control__label' }, __( 'Alternating Row Stripe Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: PRESET_PALETTES,
              value: altRowBgColor,
              onChange: function( val ) { setAttributes( { altRowBgColor: val || '' } ); }
            } ),
            el( 'p', { className: 'components-base-control__label' }, __( 'Border Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: PRESET_PALETTES,
              value: borderColor,
              onChange: function( val ) { setAttributes( { borderColor: val || '' } ); }
            } )
          )
        ),

        // ==========================================
        // IN-EDITOR TOOLTIP MODAL
        // ==========================================
        tooltipModal.isOpen && el(
          Modal,
          {
            title: __( 'Edit Attribute Explanatory Tooltip', 'my-custom-plugin' ),
            onRequestClose: function() { setTooltipModal( { isOpen: false, rowIndex: -1 } ); }
          },
          el( 'p', null, __( 'Provide a helpful explanation for readers who may not know technical terms (e.g. "White Cast", "Retinol %", "SPF Rating").', 'my-custom-plugin' ) ),
          el( TextControl, {
            label: __( 'Tooltip Content', 'my-custom-plugin' ),
            value: ( rows[ tooltipModal.rowIndex ] && rows[ tooltipModal.rowIndex ].tooltip ) || '',
            onChange: function( val ) { updateRowTooltip( tooltipModal.rowIndex, val ); }
          } ),
          el(
            Button,
            {
              variant: 'primary',
              onClick: function() { setTooltipModal( { isOpen: false, rowIndex: -1 } ); }
            },
            __( 'Done', 'my-custom-plugin' )
          )
        ),

        // ==========================================
        // IN-EDITOR LINK MODAL (Clean URL Editor)
        // ==========================================
        linkModal.isOpen && linkModal.colIndex >= 0 && items[ linkModal.colIndex ] && el(
          Modal,
          {
            title: __( 'Edit CTA Link & Affiliate Options', 'my-custom-plugin' ) + ': ' + ( items[ linkModal.colIndex ].name || '' ),
            onRequestClose: function() { setLinkModal( { isOpen: false, colIndex: -1 } ); }
          },
          el( TextControl, {
            label: __( 'Button Target URL', 'my-custom-plugin' ),
            value: items[ linkModal.colIndex ].buttonUrl || '',
            placeholder: 'https://example.com/deal',
            onChange: function( val ) { updateItem( linkModal.colIndex, 'buttonUrl', val ); }
          } ),
          el( ToggleControl, {
            label: __( 'Open in new tab', 'my-custom-plugin' ),
            checked: items[ linkModal.colIndex ].buttonNewTab !== false,
            onChange: function( val ) { updateItem( linkModal.colIndex, 'buttonNewTab', val ); }
          } ),
          el( ToggleControl, {
            label: __( 'Add rel="sponsored" (Affiliate Link)', 'my-custom-plugin' ),
            checked: items[ linkModal.colIndex ].buttonSponsored !== false,
            onChange: function( val ) { updateItem( linkModal.colIndex, 'buttonSponsored', val ); }
          } ),
          el(
            Button,
            {
              variant: 'primary',
              onClick: function() { setLinkModal( { isOpen: false, colIndex: -1 } ); }
            },
            __( 'Save Link', 'my-custom-plugin' )
          )
        ),

        // ==========================================
        // MAIN EDITABLE BLOCK CANVAS
        // ==========================================
        el(
          'div',
          blockProps,

          // 1. Top Bar: Title, Subtitle, Differences Filter (when not embedded in corner)
          el(
            'div',
            { className: 'mcp-cc-topbar' },
            el(
              'div',
              { className: 'mcp-cc-title-area' },
              el( RichText, {
                tagName: 'h2',
                className: 'mcp-cc-title',
                value: title,
                placeholder: __( 'Chart Title (e.g. Skincare Brand Comparison Chart)', 'my-custom-plugin' ),
                onChange: function( val ) { setAttributes( { title: val } ); }
              } ),
              el( RichText, {
                tagName: 'p',
                className: 'mcp-cc-subtitle',
                value: subtitle,
                placeholder: __( 'Optional subtitle or summary of evaluated attributes...', 'my-custom-plugin' ),
                onChange: function( val ) { setAttributes( { subtitle: val } ); }
              } )
            ),
            ( showDiffToggle && cornerLayout !== 'filter-embed' ) && el(
              'div',
              { className: 'mcp-cc-diff-filter' },
              el( 'div', { className: 'mcp-cc-diff-switch' } ),
              el( 'span', null, diffToggleText )
            )
          ),

          // 2. Responsive Scroll Container
          el(
            'div',
            { className: 'mcp-cc-scroll-container' },
            el(
              'table',
              {
                className: 'mcp-cc-table header-style-' + headerStyle + ' header-align-' + headerAlign +
                  ( stickyHeader ? ' has-sticky-header' : '' ) +
                  ( stickyFirstCol ? ' has-sticky-first-col' : '' )
              },

              // THEAD: Column Product Headers
              el(
                'thead',
                null,
                el(
                  'tr',
                  null,

                  // Top-Left Corner: Customizable Feature Header
                  el(
                    'th',
                    { className: 'mcp-cc-col-label valign-' + cornerVAlign },
                    el(
                      'div',
                      { className: 'mcp-cc-corner-content' },
                      cornerLayout === 'badge' && el(
                        'span',
                        { className: 'mcp-cc-corner-badge' },
                        cornerBadgeText || 'Overview'
                      ),
                      el( RichText, {
                        tagName: 'div',
                        className: 'mcp-cc-corner-title',
                        value: cornerLabel,
                        placeholder: __( 'Features & Criteria', 'my-custom-plugin' ),
                        onChange: function( val ) { setAttributes( { cornerLabel: val } ); }
                      } ),
                      ( cornerSubtitle || cornerLayout === 'standard' ) && el( RichText, {
                        tagName: 'div',
                        className: 'mcp-cc-corner-subtitle',
                        value: cornerSubtitle,
                        placeholder: __( 'Optional description / note...', 'my-custom-plugin' ),
                        onChange: function( val ) { setAttributes( { cornerSubtitle: val } ); }
                      } ),
                      ( cornerLayout === 'filter-embed' && showDiffToggle ) && el(
                        'div',
                        { className: 'mcp-cc-corner-diff' },
                        el(
                          'div',
                          { className: 'mcp-cc-diff-filter' },
                          el( 'div', { className: 'mcp-cc-diff-switch' } ),
                          el( 'span', null, diffToggleText )
                        )
                      )
                    )
                  ),

                  // Column Items
                  items.map( function( item, colIdx ) {
                    var isWinner = highlightedColId === item.id;

                    // Inner Column Card Content
                    var headerContent = el(
                      Fragment,
                      null,

                      // Column Edit Action Buttons (always visible in editor)
                      renderColActions( colIdx, isWinner, item ),

                      // Winner Badge
                      isWinner && el(
                        'div',
                        { className: 'mcp-cc-highlight-badge' },
                        highlightBadge
                      ),

                      // Optional Item Badge (Cards / Pill-box / Compact)
                      ( headerStyle !== 'text-only' && showHeaderBadges ) && el( RichText, {
                        tagName: 'div',
                        className: 'mcp-cc-item-badge',
                        value: item.badge,
                        placeholder: __( '+ Badge', 'my-custom-plugin' ),
                        onChange: function( val ) { updateItem( colIdx, 'badge', val ); }
                      } ),

                      // Product Title
                      el( RichText, {
                        tagName: 'div',
                        className: 'mcp-cc-product-name',
                        value: item.name,
                        placeholder: __( 'Column / Brand Title', 'my-custom-plugin' ),
                        onChange: function( val ) { updateItem( colIdx, 'name', val ); }
                      } ),

                      // Subtitle (Cards & Pill-box)
                      ( headerStyle !== 'text-only' && headerStyle !== 'compact' && showHeaderSubtitles ) && el( RichText, {
                        tagName: 'div',
                        className: 'mcp-cc-product-subtitle',
                        value: item.subtitle,
                        placeholder: __( 'Product Subtitle', 'my-custom-plugin' ),
                        onChange: function( val ) { updateItem( colIdx, 'subtitle', val ); }
                      } ),

                      // Compact Price Pill
                      ( headerStyle === 'compact' && showHeaderPrices ) && el(
                        'div',
                        { className: 'mcp-cc-compact-price' },
                        el( RichText, {
                          tagName: 'span',
                          value: item.price,
                          placeholder: '$0',
                          onChange: function( val ) { updateItem( colIdx, 'price', val ); }
                        } )
                      ),

                      // Full Price Display (Cards & Pill-box)
                      ( headerStyle !== 'text-only' && headerStyle !== 'compact' && showHeaderPrices ) && el(
                        'div',
                        { className: 'mcp-cc-price-wrap' },
                        el( RichText, {
                          tagName: 'span',
                          className: 'mcp-cc-price-amount',
                          value: item.price,
                          placeholder: '$0',
                          onChange: function( val ) { updateItem( colIdx, 'price', val ); }
                        } ),
                        el( RichText, {
                          tagName: 'span',
                          className: 'mcp-cc-price-period',
                          value: item.pricePeriod,
                          placeholder: '/ mo',
                          onChange: function( val ) { updateItem( colIdx, 'pricePeriod', val ); }
                        } )
                      ),

                      // Top CTA Button with clean Link Popover Button
                      ( headerStyle !== 'text-only' && headerStyle !== 'compact' && showTopCta ) && el(
                        'div',
                        { className: 'mcp-cc-btn-editor-wrap' },
                        el( RichText, {
                          tagName: 'span',
                          className: 'mcp-cc-btn',
                          value: item.buttonText,
                          placeholder: __( 'Check Price', 'my-custom-plugin' ),
                          onChange: function( val ) { updateItem( colIdx, 'buttonText', val ); }
                        } ),
                        el(
                          'button',
                          {
                            type: 'button',
                            className: 'mcp-cc-link-btn' + ( item.buttonUrl && item.buttonUrl !== '#' ? ' has-url' : '' ),
                            title: __( 'Edit Button Link & Options', 'my-custom-plugin' ),
                            onClick: function() { setLinkModal( { isOpen: true, colIndex: colIdx } ); }
                          },
                          '🔗'
                        )
                      )
                    );

                    return el(
                      'th',
                      {
                        key: item.id || colIdx,
                        className: isWinner ? 'is-highlighted' : ''
                      },
                      headerStyle === 'pill-box' ? el( 'div', { className: 'mcp-cc-pill-card' }, headerContent ) : headerContent
                    );
                  } )
                )
              ),

              // TBODY: Feature Attribute Rows
              el(
                'tbody',
                null,
                rows.map( function( row, rowIdx ) {

                  // SECTION DIVIDER CATEGORY ROW
                  if ( row.isCategory ) {
                    return el(
                      'tr',
                      { key: row.id || rowIdx, className: 'mcp-cc-category-row' },
                      el(
                        'th',
                        { colSpan: items.length + 1 },
                        el(
                          'div',
                          { className: 'mcp-cc-category-editor mcp-cc-category-inner' },
                          el(
                            'div',
                            { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' } },
                            el(
                              'span',
                              { className: 'mcp-cc-row-controls' },
                              el( 'button', { type: 'button', className: 'mcp-cc-action-btn', onClick: function() { moveRow( rowIdx, 'up' ); } }, '↑' ),
                              el( 'button', { type: 'button', className: 'mcp-cc-action-btn', onClick: function() { moveRow( rowIdx, 'down' ); } }, '↓' ),
                              el( 'button', { type: 'button', className: 'mcp-cc-action-btn is-delete', onClick: function() { deleteRow( rowIdx ); } }, '×' )
                            ),
                            el( RichText, {
                              tagName: 'span',
                              value: row.label,
                              placeholder: __( 'Category Name (e.g. Safety & Dermatology)', 'my-custom-plugin' ),
                              onChange: function( val ) { updateRowLabel( rowIdx, val ); }
                            } )
                          )
                        )
                      )
                    );
                  }

                  // REGULAR FEATURE ROW
                  return el(
                    'tr',
                    { key: row.id || rowIdx },

                    // Leftmost Cell: Feature Label & Row Actions
                    el(
                      'th',
                      { className: 'mcp-cc-row-label' },
                      el(
                        'div',
                        { className: 'mcp-cc-row-label-wrap' },
                        el(
                          'span',
                          { className: 'mcp-cc-row-controls' },
                          el( 'button', { type: 'button', className: 'mcp-cc-action-btn', onClick: function() { moveRow( rowIdx, 'up' ); } }, '↑' ),
                          el( 'button', { type: 'button', className: 'mcp-cc-action-btn', onClick: function() { moveRow( rowIdx, 'down' ); } }, '↓' ),
                          el( 'button', { type: 'button', className: 'mcp-cc-action-btn is-delete', onClick: function() { deleteRow( rowIdx ); } }, '×' )
                        ),
                        el( RichText, {
                          tagName: 'span',
                          value: row.label,
                          placeholder: __( 'Attribute Name', 'my-custom-plugin' ),
                          onChange: function( val ) { updateRowLabel( rowIdx, val ); }
                        } ),
                        el(
                          'span',
                          {
                            className: 'mcp-cc-tooltip-trigger',
                            title: row.tooltip || __( 'Click to add explanation tooltip', 'my-custom-plugin' ),
                            onClick: function() { setTooltipModal( { isOpen: true, rowIndex: rowIdx } ); }
                          },
                          'i'
                        )
                      )
                    ),

                    // Feature Value Cells for Each Column
                    items.map( function( item ) {
                      var isWinner = highlightedColId === item.id;
                      var cell = ( row.cells && row.cells[ item.id ] ) || { type: 'check', text: '' };
                      var isFocused = activeCell && activeCell.rowId === row.id && activeCell.colId === item.id;

                      return el(
                        'td',
                        {
                          key: item.id,
                          className: isWinner ? 'is-highlighted' : '',
                          onClick: function() { setActiveCell( { rowId: row.id, colId: item.id } ); }
                        },
                        el(
                          'div',
                          { className: 'mcp-cc-editable-cell' + ( isFocused ? ' is-active-cell' : '' ) },

                          // Inline Cell Type Picker
                          el(
                            'div',
                            { className: 'mcp-cc-type-picker' },
                            el(
                              'button',
                              {
                                type: 'button',
                                className: 'mcp-cc-type-opt' + ( cell.type === 'check' ? ' is-selected' : '' ),
                                title: __( 'Checkmark (Included)', 'my-custom-plugin' ),
                                onClick: function( e ) { e.stopPropagation(); updateCell( row.id, item.id, 'check' ); }
                              },
                              '✔'
                            ),
                            el(
                              'button',
                              {
                                type: 'button',
                                className: 'mcp-cc-type-opt' + ( cell.type === 'cross' ? ' is-selected' : '' ),
                                title: __( 'Cross (Not Included)', 'my-custom-plugin' ),
                                onClick: function( e ) { e.stopPropagation(); updateCell( row.id, item.id, 'cross' ); }
                              },
                              '✖'
                            ),
                            el(
                              'button',
                              {
                                type: 'button',
                                className: 'mcp-cc-type-opt' + ( cell.type === 'dash' ? ' is-selected' : '' ),
                                title: __( 'Dash / Limited', 'my-custom-plugin' ),
                                onClick: function( e ) { e.stopPropagation(); updateCell( row.id, item.id, 'dash' ); }
                              },
                              '–'
                            ),
                            el(
                              'button',
                              {
                                type: 'button',
                                className: 'mcp-cc-type-opt' + ( cell.type === 'rating' ? ' is-selected' : '' ),
                                title: __( 'Star Rating', 'my-custom-plugin' ),
                                onClick: function( e ) { e.stopPropagation(); updateCell( row.id, item.id, 'rating' ); }
                              },
                              '★'
                            ),
                            el(
                              'button',
                              {
                                type: 'button',
                                className: 'mcp-cc-type-opt' + ( cell.type === 'text' ? ' is-selected' : '' ),
                                title: __( 'Text / Price', 'my-custom-plugin' ),
                                onClick: function( e ) { e.stopPropagation(); updateCell( row.id, item.id, 'text' ); }
                              },
                              'T'
                            )
                          ),

                          // Visual Display of Current Type
                          cell.type === 'check' && el(
                            'div',
                            { className: 'mcp-cc-cell-val' },
                            el( 'span', { className: 'mcp-cc-icon-check' }, renderCheckSvg() ),
                            el( RichText, {
                              tagName: 'span',
                              className: 'mcp-cc-cell-subtext',
                              value: cell.text,
                              placeholder: __( 'Optional note', 'my-custom-plugin' ),
                              onChange: function( val ) { updateCell( row.id, item.id, undefined, val ); }
                            } )
                          ),

                          cell.type === 'cross' && el(
                            'div',
                            { className: 'mcp-cc-cell-val' },
                            el( 'span', { className: 'mcp-cc-icon-cross' }, renderCrossSvg() ),
                            el( RichText, {
                              tagName: 'span',
                              className: 'mcp-cc-cell-subtext',
                              value: cell.text,
                              placeholder: __( 'Optional note', 'my-custom-plugin' ),
                              onChange: function( val ) { updateCell( row.id, item.id, undefined, val ); }
                            } )
                          ),

                          cell.type === 'dash' && el(
                            'div',
                            { className: 'mcp-cc-cell-val' },
                            el( 'span', { className: 'mcp-cc-icon-dash' }, '—' ),
                            el( RichText, {
                              tagName: 'span',
                              className: 'mcp-cc-cell-subtext',
                              value: cell.text,
                              placeholder: __( 'Optional note', 'my-custom-plugin' ),
                              onChange: function( val ) { updateCell( row.id, item.id, undefined, val ); }
                            } )
                          ),

                          cell.type === 'rating' && el(
                            'div',
                            { className: 'mcp-cc-cell-val' },
                            el(
                              'div',
                              { className: 'mcp-cc-rating-wrap' },
                              el( 'span', { className: 'mcp-cc-stars' }, renderStarSvg() ),
                              el( RichText, {
                                tagName: 'span',
                                className: 'mcp-cc-rating-num',
                                value: String( cell.rating || 4.5 ),
                                placeholder: '4.5',
                                onChange: function( val ) { updateCell( row.id, item.id, undefined, undefined, val ); }
                              } )
                            )
                          ),

                          cell.type === 'text' && el(
                            'div',
                            { className: 'mcp-cc-cell-val' },
                            el( RichText, {
                              tagName: 'strong',
                              value: cell.text,
                              placeholder: __( 'Value', 'my-custom-plugin' ),
                              onChange: function( val ) { updateCell( row.id, item.id, undefined, val ); }
                            } )
                          )
                        )
                      );
                    } )
                  );
                } )
              ),

              // TFOOT: Optional Bottom CTA Row
              showBottomCta && el(
                'tfoot',
                null,
                el(
                  'tr',
                  null,
                  el( 'td', null ),
                  items.map( function( item ) {
                    var isWinner = highlightedColId === item.id;
                    return el(
                      'td',
                      { key: item.id, className: isWinner ? 'is-highlighted' : '' },
                      el(
                        'span',
                        { className: 'mcp-cc-btn' },
                        item.buttonText || __( 'Check Price', 'my-custom-plugin' )
                      )
                    );
                  } )
                )
              )
            )
          ),

          // 3. Quick Table Add Controls
          el(
            'div',
            { className: 'mcp-cc-table-controls' },
            el(
              'div',
              { className: 'mcp-cc-btn-group' },
              el(
                'button',
                {
                  type: 'button',
                  className: 'mcp-cc-add-btn is-primary',
                  onClick: addRow
                },
                '+ ' + __( 'Add Feature Row', 'my-custom-plugin' )
              ),
              el(
                'button',
                {
                  type: 'button',
                  className: 'mcp-cc-add-btn',
                  onClick: addCategoryRow
                },
                '+ ' + __( 'Add Category Section', 'my-custom-plugin' )
              )
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'mcp-cc-add-btn',
                onClick: addColumn
              },
              '+ ' + __( 'Add Product Column', 'my-custom-plugin' )
            )
          )
        )
      );
    },

    // ==========================================
    // SAVE FUNCTION: Output Semantic Frontend HTML
    // ==========================================
    save: function( props ) {
      var attributes = props.attributes;
      var themePreset = attributes.themePreset || 'blush';
      var title = attributes.title || '';
      var subtitle = attributes.subtitle || '';
      var showTitle = attributes.showTitle;
      var showDiffToggle = attributes.showDiffToggle;
      var diffToggleText = attributes.diffToggleText || 'Highlight Differences';
      var stickyHeader = attributes.stickyHeader;
      var stickyFirstCol = attributes.stickyFirstCol;
      var showTopCta = attributes.showTopCta !== undefined ? attributes.showTopCta : true;
      var showBottomCta = attributes.showBottomCta;
      var highlightedColId = attributes.highlightedColId || '';
      var highlightBadge = attributes.highlightBadge || '🏆 Best Overall';
      var items = attributes.items || [];
      var rows = attributes.rows || [];
      var cellPadding = attributes.cellPadding || 'normal';
      var borderRadius = attributes.borderRadius !== undefined ? attributes.borderRadius : 14;

      var headerStyle = attributes.headerStyle || 'cards';
      var showHeaderSubtitles = attributes.showHeaderSubtitles !== undefined ? attributes.showHeaderSubtitles : true;
      var showHeaderPrices = attributes.showHeaderPrices !== undefined ? attributes.showHeaderPrices : true;
      var showHeaderBadges = attributes.showHeaderBadges !== undefined ? attributes.showHeaderBadges : true;
      var headerAlign = attributes.headerAlign || 'center';

      var cornerLabel = attributes.cornerLabel !== undefined ? attributes.cornerLabel : 'Features & Criteria';
      var cornerSubtitle = attributes.cornerSubtitle || '';
      var cornerLayout = attributes.cornerLayout || 'standard';
      var cornerBadgeText = attributes.cornerBadgeText || 'Overview';
      var cornerVAlign = attributes.cornerVAlign || 'middle';

      var primaryColor = attributes.primaryColor;
      var headerBgColor = attributes.headerBgColor;
      var headerTextColor = attributes.headerTextColor;
      var altRowBgColor = attributes.altRowBgColor;
      var borderColor = attributes.borderColor;

      var blockProps = useBlockProps.save( {
        className: 'mcp-comparison-chart-wrapper theme-' + themePreset + ' padding-' + cellPadding,
        style: {
          '--mcp-cc-radius': borderRadius + 'px',
          '--mcp-cc-primary': primaryColor || undefined,
          '--mcp-cc-header-bg': headerBgColor || undefined,
          '--mcp-cc-header-text': headerTextColor || undefined,
          '--mcp-cc-alt-bg': altRowBgColor || undefined,
          '--mcp-cc-border': borderColor || undefined
        }
      } );

      return el(
        'div',
        blockProps,

        // Topbar (Only show if title/subtitle or if difference filter is not in corner)
        ( title || subtitle || ( showDiffToggle && cornerLayout !== 'filter-embed' ) ) && el(
          'div',
          { className: 'mcp-cc-topbar' },
          el(
            'div',
            { className: 'mcp-cc-title-area' },
            title && el( RichText.Content, { tagName: 'h2', className: 'mcp-cc-title', value: title } ),
            subtitle && el( RichText.Content, { tagName: 'p', className: 'mcp-cc-subtitle', value: subtitle } )
          ),
          ( showDiffToggle && cornerLayout !== 'filter-embed' ) && el(
            'button',
            {
              type: 'button',
              className: 'mcp-cc-diff-filter',
              'aria-label': diffToggleText
            },
            el( 'div', { className: 'mcp-cc-diff-switch' } ),
            el( 'span', null, diffToggleText )
          )
        ),

        // Scrollable Table Container
        el(
          'div',
          { className: 'mcp-cc-scroll-container' },
          el( 'div', { className: 'mcp-cc-mobile-hint' }, '← Swipe horizontally to compare →' ),
          el(
            'table',
            {
              className: 'mcp-cc-table header-style-' + headerStyle + ' header-align-' + headerAlign +
                ( stickyHeader ? ' has-sticky-header' : '' ) +
                ( stickyFirstCol ? ' has-sticky-first-col' : '' )
            },

            // THEAD
            el(
              'thead',
              null,
              el(
                'tr',
                null,

                // Top-Left Corner Cell
                el(
                  'th',
                  { className: 'mcp-cc-col-label valign-' + cornerVAlign },
                  el(
                    'div',
                    { className: 'mcp-cc-corner-content' },
                    cornerLayout === 'badge' && el( 'span', { className: 'mcp-cc-corner-badge' }, cornerBadgeText || 'Overview' ),
                    cornerLabel && el( RichText.Content, { tagName: 'div', className: 'mcp-cc-corner-title', value: cornerLabel } ),
                    cornerSubtitle && el( RichText.Content, { tagName: 'div', className: 'mcp-cc-corner-subtitle', value: cornerSubtitle } ),
                    ( cornerLayout === 'filter-embed' && showDiffToggle ) && el(
                      'div',
                      { className: 'mcp-cc-corner-diff' },
                      el(
                        'button',
                        {
                          type: 'button',
                          className: 'mcp-cc-diff-filter',
                          'aria-label': diffToggleText
                        },
                        el( 'div', { className: 'mcp-cc-diff-switch' } ),
                        el( 'span', null, diffToggleText )
                      )
                    )
                  )
                ),

                // Product Column Headers
                items.map( function( item, cIdx ) {
                  var isWinner = highlightedColId === item.id;
                  var relAttrs = [];
                  if ( item.buttonSponsored ) relAttrs.push( 'sponsored' );
                  relAttrs.push( 'nofollow' );
                  if ( item.buttonNewTab ) relAttrs.push( 'noopener' );

                  var cardContent = el(
                    Fragment,
                    null,

                    isWinner && el( 'div', { className: 'mcp-cc-highlight-badge' }, highlightBadge ),
                    ( headerStyle !== 'text-only' && showHeaderBadges && item.badge ) && el( RichText.Content, { tagName: 'div', className: 'mcp-cc-item-badge', value: item.badge } ),

                    el( RichText.Content, { tagName: 'div', className: 'mcp-cc-product-name', value: item.name } ),

                    ( headerStyle !== 'text-only' && headerStyle !== 'compact' && showHeaderSubtitles && item.subtitle ) && el(
                      RichText.Content,
                      { tagName: 'div', className: 'mcp-cc-product-subtitle', value: item.subtitle }
                    ),

                    ( headerStyle === 'compact' && showHeaderPrices && item.price ) && el(
                      RichText.Content,
                      { tagName: 'div', className: 'mcp-cc-compact-price', value: item.price }
                    ),

                    ( headerStyle !== 'text-only' && headerStyle !== 'compact' && showHeaderPrices && item.price ) && el(
                      'div',
                      { className: 'mcp-cc-price-wrap' },
                      el( RichText.Content, { tagName: 'span', className: 'mcp-cc-price-amount', value: item.price } ),
                      item.pricePeriod && el( RichText.Content, { tagName: 'span', className: 'mcp-cc-price-period', value: item.pricePeriod } )
                    ),

                    ( headerStyle !== 'text-only' && headerStyle !== 'compact' && showTopCta && item.buttonText ) && el(
                      'a',
                      {
                        href: item.buttonUrl || '#',
                        className: 'mcp-cc-btn',
                        target: item.buttonNewTab ? '_blank' : undefined,
                        rel: relAttrs.join( ' ' )
                      },
                      el( RichText.Content, { tagName: 'span', value: item.buttonText } )
                    )
                  );

                  return el(
                    'th',
                    { key: item.id || cIdx, className: isWinner ? 'is-highlighted' : '' },
                    headerStyle === 'pill-box' ? el( 'div', { className: 'mcp-cc-pill-card' }, cardContent ) : cardContent
                  );
                } )
              )
            ),

            // TBODY
            el(
              'tbody',
              null,
              rows.map( function( row, rIdx ) {
                if ( row.isCategory ) {
                  return el(
                    'tr',
                    { key: row.id || rIdx, className: 'mcp-cc-category-row' },
                    el(
                      'th',
                      { colSpan: items.length + 1 },
                      el( RichText.Content, { tagName: 'div', className: 'mcp-cc-category-inner', value: row.label } )
                    )
                  );
                }

                return el(
                  'tr',
                  { key: row.id || rIdx },
                  el(
                    'th',
                    { className: 'mcp-cc-row-label' },
                    el(
                      'div',
                      { className: 'mcp-cc-row-label-wrap' },
                      el( RichText.Content, { tagName: 'span', value: row.label } ),
                      row.tooltip && el(
                        'span',
                        {
                          className: 'mcp-cc-tooltip-trigger',
                          tabIndex: 0,
                          role: 'button',
                          'aria-label': row.tooltip
                        },
                        'i',
                        el( 'span', { className: 'mcp-cc-tooltip-content' }, row.tooltip )
                      )
                    )
                  ),

                  items.map( function( item ) {
                    var isWinner = highlightedColId === item.id;
                    var cell = ( row.cells && row.cells[ item.id ] ) || { type: 'check', text: '' };

                    return el(
                      'td',
                      { key: item.id, className: isWinner ? 'is-highlighted' : '' },
                      el(
                        'div',
                        { className: 'mcp-cc-cell-val' },

                        cell.type === 'check' && el(
                          Fragment,
                          null,
                          el( 'span', { className: 'mcp-cc-icon-check' }, renderCheckSvg() ),
                          cell.text && el( RichText.Content, { tagName: 'span', className: 'mcp-cc-cell-subtext', value: cell.text } )
                        ),

                        cell.type === 'cross' && el(
                          Fragment,
                          null,
                          el( 'span', { className: 'mcp-cc-icon-cross' }, renderCrossSvg() ),
                          cell.text && el( RichText.Content, { tagName: 'span', className: 'mcp-cc-cell-subtext', value: cell.text } )
                        ),

                        cell.type === 'dash' && el(
                          Fragment,
                          null,
                          el( 'span', { className: 'mcp-cc-icon-dash' }, '—' ),
                          cell.text && el( RichText.Content, { tagName: 'span', className: 'mcp-cc-cell-subtext', value: cell.text } )
                        ),

                        cell.type === 'rating' && el(
                          'div',
                          { className: 'mcp-cc-rating-wrap' },
                          el( 'span', { className: 'mcp-cc-stars' }, renderStarSvg() ),
                          el( 'span', { className: 'mcp-cc-rating-num' }, String( cell.rating || 4.5 ) )
                        ),

                        cell.type === 'text' && el(
                          RichText.Content,
                          { tagName: 'strong', value: cell.text }
                        )
                      )
                    );
                  } )
                );
              } )
            ),

            // TFOOT
            showBottomCta && el(
              'tfoot',
              null,
              el(
                'tr',
                null,
                el( 'td', null ),
                items.map( function( item ) {
                  var isWinner = highlightedColId === item.id;
                  var relAttrs = [];
                  if ( item.buttonSponsored ) relAttrs.push( 'sponsored' );
                  relAttrs.push( 'nofollow' );
                  if ( item.buttonNewTab ) relAttrs.push( 'noopener' );

                  return el(
                    'td',
                    { key: item.id, className: isWinner ? 'is-highlighted' : '' },
                    item.buttonText && el(
                      'a',
                      {
                        href: item.buttonUrl || '#',
                        className: 'mcp-cc-btn',
                        target: item.buttonNewTab ? '_blank' : undefined,
                        rel: relAttrs.join( ' ' )
                      },
                      el( RichText.Content, { tagName: 'span', value: item.buttonText } )
                    )
                  );
                } )
              )
            )
          )
        )
      );
    }
  } );
} )( window.wp );
