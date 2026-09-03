( function( wp ) {
  var el = wp.element.createElement;
  var registerBlockType = wp.blocks.registerBlockType;
  var blockEditor = wp.blockEditor;
  var useBlockProps = blockEditor.useBlockProps;
  var RichText = blockEditor.RichText;
  var InspectorControls = blockEditor.InspectorControls;
  var components = wp.components;
  var PanelBody = components.PanelBody;
  var SelectControl = components.SelectControl;
  var ColorPalette = components.ColorPalette;
  var __ = wp.i18n.__;

  var PRESET_CONFIGS = {
    disclosure: {
      title: 'Affiliate Disclosure:',
      content: 'Some links on this page may be affiliate links. If you buy through these links, BestIPTVFinder may earn a commission at no extra cost to you. This does not affect our review criteria, rankings, manual testing notes, or stated limitations.',
      accentColor: '#1d68bd',
      bgColor: '#f8fafc'
    },
    'update-log': {
      title: '📅 Update Log',
      content: 'Updated August 2026: Expanded Germany-specific buying guidance, use-case recommendations, setup steps, and trial-first advice.',
      accentColor: '#16a34a',
      bgColor: '#f7fbf8'
    },
    'recommendation-positive': {
      title: '👍 Who should choose IPTV Harmony?',
      content: 'Choose IPTV Harmony if you want the most balanced first test, the deepest listed VOD catalog, and enough trial flexibility to check German categories before buying a longer plan.',
      accentColor: '#2563eb',
      bgColor: '#f0f7ff'
    },
    'recommendation-negative': {
      title: 'Who Should Avoid:',
      content: 'Avoid IPTV Harmony if you need a verified monthly price or several confirmed simultaneous connections in the base package.',
      accentColor: '#ea580c',
      bgColor: '#fff8f1'
    }
  };

  registerBlockType( 'my-custom-plugin/callout', {
    edit: function( props ) {
      var attributes = props.attributes;
      var setAttributes = props.setAttributes;
      var preset = attributes.preset || 'disclosure';
      var title = attributes.title;
      var content = attributes.content;
      var accentColor = attributes.accentColor || '#2563eb';
      var bgColor = attributes.bgColor || '#f8fafc';

      function handlePresetChange( newPreset ) {
        var cfg = PRESET_CONFIGS[ newPreset ];
        if ( cfg ) {
          setAttributes( {
            preset: newPreset,
            title: cfg.title,
            content: cfg.content,
            accentColor: cfg.accentColor,
            bgColor: cfg.bgColor
          } );
        } else {
          setAttributes( { preset: newPreset } );
        }
      }

      var blockProps = useBlockProps( {
        className: 'mcp-callout-box mcp-callout-' + preset,
        style: {
          borderLeftColor: accentColor,
          backgroundColor: bgColor
        }
      } );

      return el(
        wp.element.Fragment,
        null,
        el(
          InspectorControls,
          null,
          el(
            PanelBody,
            { title: __( 'Callout Preset & Style', 'my-custom-plugin' ), initialOpen: true },
            el( SelectControl, {
              label: __( 'Preset Style', 'my-custom-plugin' ),
              value: preset,
              options: [
                { label: __( 'Affiliate Disclosure', 'my-custom-plugin' ), value: 'disclosure' },
                { label: __( 'Update Log', 'my-custom-plugin' ), value: 'update-log' },
                { label: __( 'Who Should Choose (Pros - Blue)', 'my-custom-plugin' ), value: 'recommendation-positive' },
                { label: __( 'Who Should Avoid (Cons - Orange)', 'my-custom-plugin' ), value: 'recommendation-negative' },
                { label: __( 'Custom Callout', 'my-custom-plugin' ), value: 'custom' }
              ],
              onChange: handlePresetChange
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 6px' } }, __( 'Left Accent Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: accentColor,
              onChange: function( color ) { setAttributes( { accentColor: color || '#2563eb' } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '14px 0 6px' } }, __( 'Background Tint', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              value: bgColor,
              onChange: function( color ) { setAttributes( { bgColor: color || '#f8fafc' } ); }
            } )
          )
        ),
        el(
          'aside',
          blockProps,
          el(
            'div',
            { className: 'mcp-callout-body' },
            title && el( RichText, {
              tagName: 'span',
              className: 'mcp-callout-title-inline',
              value: title,
              placeholder: __( 'Callout Title...', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { title: val } ); }
            } ),
            el( RichText, {
              tagName: 'span',
              className: 'mcp-callout-content-inline',
              value: content,
              placeholder: __( 'Callout description or disclosure...', 'my-custom-plugin' ),
              onChange: function( val ) { setAttributes( { content: val } ); }
            } )
          )
        )
      );
    },

    save: function( props ) {
      var attributes = props.attributes;
      var preset = attributes.preset || 'disclosure';
      var title = attributes.title;
      var content = attributes.content;
      var accentColor = attributes.accentColor || '#2563eb';
      var bgColor = attributes.bgColor || '#f8fafc';

      var blockProps = useBlockProps.save( {
        className: 'mcp-callout-box mcp-callout-' + preset,
        style: {
          borderLeftColor: accentColor,
          backgroundColor: bgColor
        }
      } );

      return el(
        'aside',
        blockProps,
        el(
          'div',
          { className: 'mcp-callout-body' },
          title && el( RichText.Content, {
            tagName: 'span',
            className: 'mcp-callout-title-inline',
            value: title
          } ),
          el( 'span', null, ' ' ),
          el( RichText.Content, {
            tagName: 'span',
            className: 'mcp-callout-content-inline',
            value: content
          } )
        )
      );
    }
  } );
} )( window.wp );
