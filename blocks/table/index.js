( function( wp ) {
  var el = wp.element.createElement;
  var useState = wp.element.useState;
  var Fragment = wp.element.Fragment;
  var registerBlockType = wp.blocks.registerBlockType;
  var blockEditor = wp.blockEditor;
  var useBlockProps = blockEditor.useBlockProps;
  var RichText = blockEditor.RichText;
  var InspectorControls = blockEditor.InspectorControls;
  var BlockControls = blockEditor.BlockControls;
  var components = wp.components;
  var PanelBody = components.PanelBody;
  var ToggleControl = components.ToggleControl;
  var SelectControl = components.SelectControl;
  var ColorPalette = components.ColorPalette;
  var ToolbarDropdownMenu = components.ToolbarDropdownMenu;
  var Button = components.Button;
  var ResizableBox = components.ResizableBox;
  var __ = wp.i18n.__;

  // Preset color palette for headers & text
  var HEADER_COLORS = [
    { name: 'Primary Blue', color: '#2563eb' },
    { name: 'Emerald Green', color: '#059669' },
    { name: 'Slate Dark', color: '#1e293b' },
    { name: 'Purple Accent', color: '#7c3aed' },
    { name: 'Rose Red', color: '#e11d48' },
    { name: 'Amber Orange', color: '#d97706' },
    { name: 'Subtle Gray', color: '#f1f5f9' },
    { name: 'Dark Text', color: '#0f172a' },
    { name: 'Pure White', color: '#ffffff' }
  ];

  // Preset color palette specifically designed for Row Backgrounds
  var ROW_BG_COLORS = [
    { name: 'Soft Blue', color: '#dbeafe' },
    { name: 'Soft Green', color: '#d1fae5' },
    { name: 'Soft Yellow / Highlight', color: '#fef08a' },
    { name: 'Soft Red / Alert', color: '#fee2e2' },
    { name: 'Soft Purple', color: '#f3e8ff' },
    { name: 'Soft Pink', color: '#fce7f3' },
    { name: 'Light Gray', color: '#f1f5f9' },
    { name: 'Dark Charcoal', color: '#1e293b' },
    { name: 'Pure White', color: '#ffffff' }
  ];

  registerBlockType( 'my-custom-plugin/table', {
    edit: function( props ) {
      var attributes = props.attributes;
      var setAttributes = props.setAttributes;
      var head = attributes.head || [];
      var body = attributes.body || [];
      var foot = attributes.foot || [];
      var hasHeaderRow = attributes.hasHeaderRow;
      var hasFooterRow = attributes.hasFooterRow;
      var hasFixedLayout = attributes.hasFixedLayout;
      var tableStyle = attributes.tableStyle || 'modern';
      var headerBgColor = attributes.headerBgColor || '#2563eb';
      var headerTextColor = attributes.headerTextColor || '#ffffff';
      var tableWidth = attributes.tableWidth || '100%';
      var caption = attributes.caption || '';

      // Active cell tracking
      var activeState = useState( { section: 'body', rowIndex: 0, colIndex: 0 } );
      var activeCell = activeState[0];
      var setActiveCell = activeState[1];

      // Retrieve currently active row
      var activeSectionList = attributes[ activeCell.section ] || [];
      var activeRow = activeSectionList[ activeCell.rowIndex ] || null;
      var activeRowBg = activeRow && activeRow.bgColor ? activeRow.bgColor : '';
      var activeRowText = activeRow && activeRow.textColor ? activeRow.textColor : '';

      // Helper: Update a single cell content
      function updateCell( sectionName, rIndex, cIndex, newContent ) {
        var sectionData = attributes[ sectionName ] ? JSON.parse( JSON.stringify( attributes[ sectionName ] ) ) : [];
        if ( sectionData[ rIndex ] && sectionData[ rIndex ].cells[ cIndex ] ) {
          sectionData[ rIndex ].cells[ cIndex ].content = newContent;
          var update = {};
          update[ sectionName ] = sectionData;
          setAttributes( update );
        }
      }

      // Helper: Update active row background or text color
      function updateActiveRowColor( newBg, newText ) {
        var sectionData = attributes[ activeCell.section ] ? JSON.parse( JSON.stringify( attributes[ activeCell.section ] ) ) : [];
        if ( sectionData[ activeCell.rowIndex ] ) {
          if ( newBg !== undefined ) {
            if ( newBg ) {
              sectionData[ activeCell.rowIndex ].bgColor = newBg;
            } else {
              delete sectionData[ activeCell.rowIndex ].bgColor;
            }
          }
          if ( newText !== undefined ) {
            if ( newText ) {
              sectionData[ activeCell.rowIndex ].textColor = newText;
            } else {
              delete sectionData[ activeCell.rowIndex ].textColor;
            }
          }
          var update = {};
          update[ activeCell.section ] = sectionData;
          setAttributes( update );
        }
      }

      // Column count helper
      function getColumnCount() {
        if ( head.length && head[0].cells ) return head[0].cells.length;
        if ( body.length && body[0].cells ) return body[0].cells.length;
        return 3;
      }

      // Add Row
      function addRow( targetIndex, position ) {
        var cols = getColumnCount();
        var newCells = [];
        for ( var c = 0; c < cols; c++ ) {
          newCells.push( { content: '', tag: 'td' } );
        }
        var newBody = JSON.parse( JSON.stringify( body ) );
        var insertAt = ( typeof targetIndex === 'number' ) 
          ? ( position === 'before' ? targetIndex : targetIndex + 1 )
          : newBody.length;
        newBody.splice( insertAt, 0, { cells: newCells } );
        setAttributes( { body: newBody } );
      }

      // Delete Row
      function deleteRow( targetIndex ) {
        if ( body.length <= 1 ) return;
        var rIndex = ( typeof targetIndex === 'number' ) ? targetIndex : body.length - 1;
        var newBody = JSON.parse( JSON.stringify( body ) );
        newBody.splice( rIndex, 1 );
        setAttributes( { body: newBody } );
      }

      // Add Column
      function addColumn( targetIndex, position ) {
        var newHead = JSON.parse( JSON.stringify( head ) );
        var newBody = JSON.parse( JSON.stringify( body ) );
        var newFoot = JSON.parse( JSON.stringify( foot ) );
        var cols = getColumnCount();
        var insertAt = ( typeof targetIndex === 'number' )
          ? ( position === 'before' ? targetIndex : targetIndex + 1 )
          : cols;

        newHead.forEach( function( r ) {
          r.cells.splice( insertAt, 0, { content: 'Header ' + ( insertAt + 1 ), tag: 'th' } );
        } );
        newBody.forEach( function( r ) {
          r.cells.splice( insertAt, 0, { content: '', tag: 'td' } );
        } );
        newFoot.forEach( function( r ) {
          r.cells.splice( insertAt, 0, { content: '', tag: 'td' } );
        } );

        setAttributes( { head: newHead, body: newBody, foot: newFoot } );
      }

      // Delete Column
      function deleteColumn( targetIndex ) {
        if ( getColumnCount() <= 1 ) return;
        var newHead = JSON.parse( JSON.stringify( head ) );
        var newBody = JSON.parse( JSON.stringify( body ) );
        var newFoot = JSON.parse( JSON.stringify( foot ) );
        var deleteAt = ( typeof targetIndex === 'number' ) ? targetIndex : getColumnCount() - 1;

        newHead.forEach( function( r ) { r.cells.splice( deleteAt, 1 ); } );
        newBody.forEach( function( r ) { r.cells.splice( deleteAt, 1 ); } );
        newFoot.forEach( function( r ) { r.cells.splice( deleteAt, 1 ); } );

        setAttributes( { head: newHead, body: newBody, foot: newFoot } );
      }

      var blockProps = useBlockProps( {
        className: 'wp-block-my-custom-plugin-table table-style-' + tableStyle
      } );

      // Active row label
      var activeRowLabel = activeCell.section === 'head'
        ? __( 'Header Row', 'my-custom-plugin' )
        : activeCell.section === 'foot'
          ? __( 'Footer Row', 'my-custom-plugin' )
          : __( 'Row #', 'my-custom-plugin' ) + ( activeCell.rowIndex + 1 );

      return el(
        Fragment,
        null,

        // Block Toolbar Dropdown Controls
        el(
          BlockControls,
          null,
          el( ToolbarDropdownMenu, {
            icon: 'editor-table',
            label: __( 'Edit Table', 'my-custom-plugin' ),
            controls: [
              {
                title: __( 'Insert Row Before', 'my-custom-plugin' ),
                icon: 'insert-before',
                onClick: function() { addRow( activeCell.rowIndex, 'before' ); }
              },
              {
                title: __( 'Insert Row After', 'my-custom-plugin' ),
                icon: 'insert-after',
                onClick: function() { addRow( activeCell.rowIndex, 'after' ); }
              },
              {
                title: __( 'Delete Row', 'my-custom-plugin' ),
                icon: 'trash',
                onClick: function() { deleteRow( activeCell.rowIndex ); }
              },
              {
                title: __( 'Insert Column Before', 'my-custom-plugin' ),
                icon: 'insert-before',
                onClick: function() { addColumn( activeCell.colIndex, 'before' ); }
              },
              {
                title: __( 'Insert Column After', 'my-custom-plugin' ),
                icon: 'insert-after',
                onClick: function() { addColumn( activeCell.colIndex, 'after' ); }
              },
              {
                title: __( 'Delete Column', 'my-custom-plugin' ),
                icon: 'trash',
                onClick: function() { deleteColumn( activeCell.colIndex ); }
              }
            ]
          } )
        ),

        // Sidebar Inspector Controls
        el(
          InspectorControls,
          null,

          // Panel 1: Selected Row Color (What the user asked for!)
          el(
            PanelBody,
            {
              title: __( 'Selected Row Color', 'my-custom-plugin' ) + ' (' + activeRowLabel + ')',
              initialOpen: true
            },
            el( 'p', { style: { fontSize: '12px', color: '#64748b', margin: '0 0 12px' } },
              __( 'Click any cell to select its row, then set a whole-row background color below:', 'my-custom-plugin' )
            ),
            el( 'p', { style: { fontWeight: 600, marginBottom: '6px' } }, __( 'Row Background Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: ROW_BG_COLORS,
              value: activeRowBg,
              onChange: function( color ) { updateActiveRowColor( color, undefined ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '12px 0 6px' } }, __( 'Row Text Color (Optional)', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: HEADER_COLORS,
              value: activeRowText,
              onChange: function( color ) { updateActiveRowColor( undefined, color ); }
            } ),
            ( activeRowBg || activeRowText ) && el( Button, {
              variant: 'secondary',
              isSmall: true,
              style: { marginTop: '12px', width: '100%', justifyContent: 'center' },
              onClick: function() { updateActiveRowColor( '', '' ); }
            }, __( 'Clear Row Color', 'my-custom-plugin' ) )
          ),

          // Panel 2: Table Settings
          el(
            PanelBody,
            { title: __( 'Table Settings & Size', 'my-custom-plugin' ), initialOpen: false },
            el( ToggleControl, {
              label: __( 'Header Section', 'my-custom-plugin' ),
              checked: hasHeaderRow,
              onChange: function( val ) { setAttributes( { hasHeaderRow: val } ); }
            } ),
            el( ToggleControl, {
              label: __( 'Footer Section', 'my-custom-plugin' ),
              checked: hasFooterRow,
              onChange: function( val ) { setAttributes( { hasFooterRow: val } ); }
            } ),
            el( ToggleControl, {
              label: __( 'Fixed Width Table Cells', 'my-custom-plugin' ),
              checked: hasFixedLayout,
              onChange: function( val ) { setAttributes( { hasFixedLayout: val } ); }
            } ),
            el( 'div', { style: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' } },
              el( 'p', { style: { fontWeight: 600, margin: '0 0 6px' } }, __( 'Table Width:', 'my-custom-plugin' ) + ' ' + tableWidth ),
              el( 'p', { style: { fontSize: '12px', color: '#64748b', margin: '0 0 8px' } },
                __( 'Tip: You can also drag the blue handle at the bottom-right corner of the table in the canvas to resize!', 'my-custom-plugin' )
              ),
              tableWidth !== '100%' && el( Button, {
                variant: 'secondary',
                isSmall: true,
                onClick: function() { setAttributes( { tableWidth: '100%' } ); }
              }, __( 'Reset to 100% Full Width', 'my-custom-plugin' ) )
            )
          ),

          // Panel 3: Table Styles
          el(
            PanelBody,
            { title: __( 'Table Styles', 'my-custom-plugin' ), initialOpen: false },
            el( SelectControl, {
              label: __( 'Design Preset', 'my-custom-plugin' ),
              value: tableStyle,
              options: [
                { label: __( 'Modern Clean (Default)', 'my-custom-plugin' ), value: 'modern' },
                { label: __( 'Striped Rows', 'my-custom-plugin' ), value: 'striped' },
                { label: __( 'Bordered Grid', 'my-custom-plugin' ), value: 'bordered' },
                { label: __( 'Minimalist', 'my-custom-plugin' ), value: 'minimal' },
                { label: __( 'Dark / Elegant', 'my-custom-plugin' ), value: 'dark' }
              ],
              onChange: function( val ) { setAttributes( { tableStyle: val } ); }
            } )
          ),

          // Panel 4: Header Colors
          el(
            PanelBody,
            { title: __( 'Header Default Colors', 'my-custom-plugin' ), initialOpen: false },
            el( 'p', { style: { fontWeight: 600, marginBottom: '8px' } }, __( 'Header Background Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: HEADER_COLORS,
              value: headerBgColor,
              onChange: function( color ) { setAttributes( { headerBgColor: color || '#2563eb' } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 8px' } }, __( 'Header Text Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: HEADER_COLORS,
              value: headerTextColor,
              onChange: function( color ) { setAttributes( { headerTextColor: color || '#ffffff' } ); }
            } )
          )
        ),

        // Main In-Canvas Block
        el(
          'figure',
          blockProps,

          // ResizableBox allowing corner drag resizing!
          el(
            ResizableBox,
            {
              size: { width: tableWidth, height: 'auto' },
              minWidth: 260,
              maxWidth: '100%',
              enable: {
                top: false,
                right: true,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: true,
                bottomLeft: false,
                topLeft: false
              },
              onResizeStop: function( event, direction, elt ) {
                setAttributes( { tableWidth: elt.style.width || ( elt.clientWidth + 'px' ) } );
              },
              showHandle: true
            },
            el(
              'div',
              { className: 'mcp-table-responsive-wrapper' },
              el(
                'table',
                { className: 'mcp-modern-table' + ( hasFixedLayout ? ' has-fixed-layout' : '' ) },

                // Table Header
                hasHeaderRow && head.length > 0 && el(
                  'thead',
                  null,
                  head.map( function( row, rIdx ) {
                    var trStyle = {};
                    trStyle.backgroundColor = row.bgColor || headerBgColor;
                    trStyle.color = row.textColor || headerTextColor;

                    return el(
                      'tr',
                      {
                        key: rIdx,
                        style: trStyle,
                        onClick: function() { setActiveCell( { section: 'head', rowIndex: rIdx, colIndex: activeCell.colIndex } ); }
                      },
                      row.cells.map( function( cell, cIdx ) {
                        return el(
                          'th',
                          {
                            key: cIdx,
                            className: 'mcp-editor-cell',
                            style: { color: row.textColor || headerTextColor }
                          },
                          el( RichText, {
                            tagName: 'div',
                            value: cell.content,
                            placeholder: __( 'Header...', 'my-custom-plugin' ),
                            onChange: function( val ) { updateCell( 'head', rIdx, cIdx, val ); },
                            onFocus: function() { setActiveCell( { section: 'head', rowIndex: rIdx, colIndex: cIdx } ); }
                          } )
                        );
                      } )
                    );
                  } )
                ),

                // Table Body
                el(
                  'tbody',
                  null,
                  body.map( function( row, rIdx ) {
                    var trStyle = {};
                    if ( row.bgColor ) trStyle.backgroundColor = row.bgColor;
                    if ( row.textColor ) trStyle.color = row.textColor;

                    return el(
                      'tr',
                      {
                        key: rIdx,
                        style: trStyle,
                        onClick: function() { setActiveCell( { section: 'body', rowIndex: rIdx, colIndex: activeCell.colIndex } ); }
                      },
                      row.cells.map( function( cell, cIdx ) {
                        return el(
                          'td',
                          {
                            key: cIdx,
                            className: 'mcp-editor-cell',
                            style: row.textColor ? { color: row.textColor } : undefined
                          },
                          el( RichText, {
                            tagName: 'div',
                            value: cell.content,
                            placeholder: __( 'Empty cell', 'my-custom-plugin' ),
                            onChange: function( val ) { updateCell( 'body', rIdx, cIdx, val ); },
                            onFocus: function() { setActiveCell( { section: 'body', rowIndex: rIdx, colIndex: cIdx } ); }
                          } )
                        );
                      } )
                    );
                  } )
                ),

                // Table Footer
                hasFooterRow && foot.length > 0 && el(
                  'tfoot',
                  null,
                  foot.map( function( row, rIdx ) {
                    var trStyle = {};
                    if ( row.bgColor ) trStyle.backgroundColor = row.bgColor;
                    if ( row.textColor ) trStyle.color = row.textColor;

                    return el(
                      'tr',
                      {
                        key: rIdx,
                        style: trStyle,
                        onClick: function() { setActiveCell( { section: 'foot', rowIndex: rIdx, colIndex: activeCell.colIndex } ); }
                      },
                      row.cells.map( function( cell, cIdx ) {
                        return el(
                          'td',
                          {
                            key: cIdx,
                            className: 'mcp-editor-cell',
                            style: row.textColor ? { color: row.textColor } : undefined
                          },
                          el( RichText, {
                            tagName: 'div',
                            value: cell.content,
                            placeholder: __( 'Footer cell', 'my-custom-plugin' ),
                            onChange: function( val ) { updateCell( 'foot', rIdx, cIdx, val ); },
                            onFocus: function() { setActiveCell( { section: 'foot', rowIndex: rIdx, colIndex: cIdx } ); }
                          } )
                        );
                      } )
                    );
                  } )
                ),

                // Table Caption
                el(
                  'caption',
                  { className: 'mcp-table-caption' },
                  el( RichText, {
                    tagName: 'span',
                    value: caption,
                    placeholder: __( 'Write table caption (optional)...', 'my-custom-plugin' ),
                    onChange: function( val ) { setAttributes( { caption: val } ); }
                  } )
                )
              )
            )
          ),

          // Quick Action helper bar
          el(
            'div',
            { className: 'mcp-editor-actions-bar' },
            el( 'span', null, __( 'Quick Actions:', 'my-custom-plugin' ) ),
            el( Button, {
              className: 'mcp-action-btn',
              onClick: function() { addRow(); }
            }, '+ ' + __( 'Add Row', 'my-custom-plugin' ) ),
            el( Button, {
              className: 'mcp-action-btn',
              onClick: function() { addColumn(); }
            }, '+ ' + __( 'Add Column', 'my-custom-plugin' ) ),
            body.length > 1 && el( Button, {
              className: 'mcp-action-btn is-destructive',
              onClick: function() { deleteRow(); }
            }, '- ' + __( 'Delete Row', 'my-custom-plugin' ) ),
            getColumnCount() > 1 && el( Button, {
              className: 'mcp-action-btn is-destructive',
              onClick: function() { deleteColumn(); }
            }, '- ' + __( 'Delete Column', 'my-custom-plugin' ) ),

            // Active row color status indicator
            el( 'div', { className: 'mcp-active-row-indicator' },
              activeRowBg && el( 'span', {
                className: 'mcp-color-preview-dot',
                style: { backgroundColor: activeRowBg }
              } ),
              el( 'span', null, __( 'Selected: ', 'my-custom-plugin' ) + activeRowLabel )
            )
          )
        )
      );
    },

    save: function( props ) {
      var attributes = props.attributes;
      var head = attributes.head || [];
      var body = attributes.body || [];
      var foot = attributes.foot || [];
      var hasHeaderRow = attributes.hasHeaderRow;
      var hasFooterRow = attributes.hasFooterRow;
      var hasFixedLayout = attributes.hasFixedLayout;
      var tableStyle = attributes.tableStyle || 'modern';
      var headerBgColor = attributes.headerBgColor || '#2563eb';
      var headerTextColor = attributes.headerTextColor || '#ffffff';
      var tableWidth = attributes.tableWidth || '100%';
      var caption = attributes.caption || '';

      var blockProps = useBlockProps.save( {
        className: 'wp-block-my-custom-plugin-table table-style-' + tableStyle
      } );

      return el(
        'figure',
        blockProps,
        el(
          'div',
          {
            className: 'mcp-table-responsive-wrapper',
            style: { width: tableWidth, maxWidth: '100%' }
          },
          el(
            'table',
            { className: 'mcp-modern-table' + ( hasFixedLayout ? ' has-fixed-layout' : '' ) },

            // Table Header
            hasHeaderRow && head.length > 0 && el(
              'thead',
              null,
              head.map( function( row, rIdx ) {
                var trStyle = {};
                trStyle.backgroundColor = row.bgColor || headerBgColor;
                trStyle.color = row.textColor || headerTextColor;

                return el(
                  'tr',
                  { key: rIdx, style: trStyle },
                  row.cells.map( function( cell, cIdx ) {
                    return el(
                      'th',
                      {
                        key: cIdx,
                        style: { color: row.textColor || headerTextColor }
                      },
                      el( RichText.Content, { value: cell.content } )
                    );
                  } )
                );
              } )
            ),

            // Table Body
            el(
              'tbody',
              null,
              body.map( function( row, rIdx ) {
                var trStyle = {};
                if ( row.bgColor ) trStyle.backgroundColor = row.bgColor;
                if ( row.textColor ) trStyle.color = row.textColor;

                return el(
                  'tr',
                  { key: rIdx, style: trStyle },
                  row.cells.map( function( cell, cIdx ) {
                    return el(
                      'td',
                      {
                        key: cIdx,
                        style: row.textColor ? { color: row.textColor } : undefined
                      },
                      el( RichText.Content, { value: cell.content } )
                    );
                  } )
                );
              } )
            ),

            // Table Footer
            hasFooterRow && foot.length > 0 && el(
              'tfoot',
              null,
              foot.map( function( row, rIdx ) {
                var trStyle = {};
                if ( row.bgColor ) trStyle.backgroundColor = row.bgColor;
                if ( row.textColor ) trStyle.color = row.textColor;

                return el(
                  'tr',
                  { key: rIdx, style: trStyle },
                  row.cells.map( function( cell, cIdx ) {
                    return el(
                      'td',
                      {
                        key: cIdx,
                        style: row.textColor ? { color: row.textColor } : undefined
                      },
                      el( RichText.Content, { value: cell.content } )
                    );
                  } )
                );
              } )
            ),

            // Table Caption
            caption && el(
              'caption',
              { className: 'mcp-table-caption' },
              el( RichText.Content, { value: caption } )
            )
          )
        )
      );
    }
  } );
} )( window.wp );
