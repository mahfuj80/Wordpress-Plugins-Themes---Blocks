( function( wp ) {
  var el = wp.element.createElement;
  var registerBlockType = wp.blocks.registerBlockType;
  var blockEditor = wp.blockEditor;
  var useBlockProps = blockEditor.useBlockProps;
  var RichText = blockEditor.RichText;
  var InspectorControls = blockEditor.InspectorControls;
  var components = wp.components;
  var PanelBody = components.PanelBody;
  var RangeControl = components.RangeControl;
  var TextControl = components.TextControl;
  var Button = components.Button;
  var __ = wp.i18n.__;

  registerBlockType( 'my-custom-plugin/quick-picks', {
    edit: function( props ) {
      var attributes = props.attributes;
      var setAttributes = props.setAttributes;
      var columns = attributes.columns || 3;
      var cards = attributes.cards || [];

      function updateCard( index, field, value ) {
        var newCards = JSON.parse( JSON.stringify( cards ) );
        if ( newCards[ index ] ) {
          newCards[ index ][ field ] = value;
          setAttributes( { cards: newCards } );
        }
      }

      function addCard() {
        var newCards = JSON.parse( JSON.stringify( cards ) );
        newCards.push( {
          badge: '⭐ TOP PICK',
          title: 'Product Name',
          url: '',
          description: 'Add a concise summary explaining why this pick stands out.'
        } );
        setAttributes( { cards: newCards } );
      }

      function deleteCard( index ) {
        if ( cards.length <= 1 ) return;
        var newCards = JSON.parse( JSON.stringify( cards ) );
        newCards.splice( index, 1 );
        setAttributes( { cards: newCards } );
      }

      var blockProps = useBlockProps( {
        className: 'mcp-quick-picks-wrapper'
      } );

      return el(
        wp.element.Fragment,
        null,
        el(
          InspectorControls,
          null,
          el(
            PanelBody,
            { title: __( 'Grid Layout Settings', 'my-custom-plugin' ), initialOpen: true },
            el( RangeControl, {
              label: __( 'Columns (Desktop)', 'my-custom-plugin' ),
              value: columns,
              min: 1,
              max: 4,
              onChange: function( val ) { setAttributes( { columns: val } ); }
            } )
          )
        ),
        el(
          'div',
          blockProps,
          el(
            'div',
            {
              className: 'mcp-quick-picks-grid',
              style: { '--mcp-cols': columns }
            },
            cards.map( function( card, index ) {
              return el(
                'div',
                { key: index, className: 'mcp-pick-card' },

                // Category Badge
                el( RichText, {
                  tagName: 'div',
                  className: 'mcp-pick-badge',
                  value: card.badge,
                  placeholder: __( '🏆 CATEGORY BADGE', 'my-custom-plugin' ),
                  onChange: function( val ) { updateCard( index, 'badge', val ); }
                } ),

                // Product Title
                el( RichText, {
                  tagName: 'div',
                  className: 'mcp-pick-title',
                  value: card.title,
                  placeholder: __( 'Product Name', 'my-custom-plugin' ),
                  onChange: function( val ) { updateCard( index, 'title', val ); }
                } ),

                // Optional Link Input in editor
                el( TextControl, {
                  placeholder: __( 'Optional Link URL (e.g. https://...)', 'my-custom-plugin' ),
                  value: card.url || '',
                  onChange: function( val ) { updateCard( index, 'url', val ); },
                  style: { fontSize: '11px', marginBottom: '8px' }
                } ),

                // Description
                el( RichText, {
                  tagName: 'p',
                  className: 'mcp-pick-desc',
                  value: card.description,
                  placeholder: __( 'Why this product was chosen...', 'my-custom-plugin' ),
                  onChange: function( val ) { updateCard( index, 'description', val ); }
                } ),

                // Card actions
                cards.length > 1 && el(
                  'div',
                  { className: 'mcp-card-actions' },
                  el( Button, {
                    isDestructive: true,
                    isSmall: true,
                    variant: 'tertiary',
                    onClick: function() { deleteCard( index ); }
                  }, __( 'Delete Card', 'my-custom-plugin' ) )
                )
              );
            } )
          ),

          // Add Card Button
          el( Button, {
            variant: 'secondary',
            className: 'mcp-grid-add-btn',
            onClick: addCard
          }, '+ ' + __( 'Add Recommendation Card', 'my-custom-plugin' ) )
        )
      );
    },

    save: function( props ) {
      var attributes = props.attributes;
      var columns = attributes.columns || 3;
      var cards = attributes.cards || [];

      var blockProps = useBlockProps.save( {
        className: 'mcp-quick-picks-wrapper'
      } );

      return el(
        'div',
        blockProps,
        el(
          'div',
          {
            className: 'mcp-quick-picks-grid',
            style: { '--mcp-cols': columns }
          },
          cards.map( function( card, index ) {
            return el(
              'div',
              { key: index, className: 'mcp-pick-card' },
              card.badge && el( RichText.Content, {
                tagName: 'div',
                className: 'mcp-pick-badge',
                value: card.badge
              } ),
              card.url ? el(
                'a',
                {
                  href: card.url,
                  className: 'mcp-pick-title',
                  target: '_blank',
                  rel: 'noopener noreferrer'
                },
                el( RichText.Content, {
                  tagName: 'span',
                  value: card.title
                } )
              ) : el( RichText.Content, {
                tagName: 'div',
                className: 'mcp-pick-title',
                value: card.title
              } ),
              el( RichText.Content, {
                tagName: 'p',
                className: 'mcp-pick-desc',
                value: card.description
              } )
            );
          } )
        )
      );
    }
  } );
} )( window.wp );
