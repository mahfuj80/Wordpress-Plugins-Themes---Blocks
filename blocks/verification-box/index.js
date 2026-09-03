( function( wp ) {
  var el = wp.element.createElement;
  var registerBlockType = wp.blocks.registerBlockType;
  var blockEditor = wp.blockEditor;
  var useBlockProps = blockEditor.useBlockProps;
  var RichText = blockEditor.RichText;
  var InspectorControls = blockEditor.InspectorControls;
  var components = wp.components;
  var PanelBody = components.PanelBody;
  var TextControl = components.TextControl;
  var ColorPalette = components.ColorPalette;
  var __ = wp.i18n.__;

  var RIBBON_COLORS = [
    { name: 'Forest Green', color: '#2b7a4b' },
    { name: 'Emerald', color: '#059669' },
    { name: 'Navy Blue', color: '#1d4ed8' },
    { name: 'Amber Gold', color: '#d97706' },
    { name: 'Ruby Red', color: '#dc2626' },
    { name: 'Dark Slate', color: '#0f2744' }
  ];

  registerBlockType( 'my-custom-plugin/verification-box', {
    edit: function( props ) {
      var attributes = props.attributes;
      var setAttributes = props.setAttributes;
      var ribbonText = attributes.ribbonText || 'VERIFIED';
      var ribbonBgColor = attributes.ribbonBgColor || '#2b7a4b';
      var headerText = attributes.headerText;
      var section1Title = attributes.section1Title;
      var section1Intro = attributes.section1Intro;
      var checksList = attributes.checksList;
      var section2Title = attributes.section2Title;
      var section2Text = attributes.section2Text;
      var borderColor = attributes.borderColor || '#0f2744';

      var blockProps = useBlockProps( {
        className: 'mcp-verification-box',
        style: { borderColor: borderColor }
      } );

      return el(
        wp.element.Fragment,
        null,
        el(
          InspectorControls,
          null,
          el(
            PanelBody,
            { title: __( 'Corner Ribbon Badge', 'my-custom-plugin' ), initialOpen: true },
            el( TextControl, {
              label: __( 'Badge Text', 'my-custom-plugin' ),
              value: ribbonText,
              onChange: function( val ) { setAttributes( { ribbonText: val } ); }
            } ),
            el( 'p', { style: { fontWeight: 600, margin: '12px 0 6px' } }, __( 'Badge Background Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: RIBBON_COLORS,
              value: ribbonBgColor,
              onChange: function( color ) { setAttributes( { ribbonBgColor: color || '#2b7a4b' } ); }
            } )
          ),
          el(
            PanelBody,
            { title: __( 'Box Border & Style', 'my-custom-plugin' ), initialOpen: false },
            el( 'p', { style: { fontWeight: 600, marginBottom: '6px' } }, __( 'Box Border Color', 'my-custom-plugin' ) ),
            el( ColorPalette, {
              colors: RIBBON_COLORS,
              value: borderColor,
              onChange: function( color ) { setAttributes( { borderColor: color || '#0f2744' } ); }
            } )
          )
        ),
        el(
          'div',
          blockProps,

          // Corner Ribbon
          ribbonText && el(
            'div',
            {
              className: 'mcp-corner-ribbon',
              style: { backgroundColor: ribbonBgColor }
            },
            ribbonText
          ),

          // Header
          el( RichText, {
            tagName: 'div',
            className: 'mcp-verification-header',
            value: headerText,
            placeholder: __( 'TESTED & VERIFIED BY [BRAND]', 'my-custom-plugin' ),
            onChange: function( val ) { setAttributes( { headerText: val } ); }
          } ),

          // Dotted Divider
          el( 'hr', { className: 'mcp-verification-divider' } ),

          // Section 1: Checks Title & Intro
          el( RichText, {
            tagName: 'h4',
            className: 'mcp-verification-section-title',
            value: section1Title,
            placeholder: __( 'Our Verification Checks', 'my-custom-plugin' ),
            onChange: function( val ) { setAttributes( { section1Title: val } ); }
          } ),
          el( RichText, {
            tagName: 'p',
            className: 'mcp-verification-intro',
            value: section1Intro,
            placeholder: __( 'Introductory explanation...', 'my-custom-plugin' ),
            onChange: function( val ) { setAttributes( { section1Intro: val } ); }
          } ),

          // Checklist items
          el( RichText, {
            tagName: 'ul',
            multiline: 'li',
            className: 'mcp-verification-list',
            value: checksList,
            placeholder: __( 'Add verification check bullet points...', 'my-custom-plugin' ),
            onChange: function( val ) { setAttributes( { checksList: val } ); }
          } ),

          // Section 2: Limitations
          el( RichText, {
            tagName: 'h4',
            className: 'mcp-verification-limitations-title',
            value: section2Title,
            placeholder: __( 'Testing Limitations', 'my-custom-plugin' ),
            onChange: function( val ) { setAttributes( { section2Title: val } ); }
          } ),
          el( RichText, {
            tagName: 'p',
            className: 'mcp-verification-limitations-text',
            value: section2Text,
            placeholder: __( 'Explanation of testing limitations and disclaimers...', 'my-custom-plugin' ),
            onChange: function( val ) { setAttributes( { section2Text: val } ); }
          } )
        )
      );
    },

    save: function( props ) {
      var attributes = props.attributes;
      var ribbonText = attributes.ribbonText || 'VERIFIED';
      var ribbonBgColor = attributes.ribbonBgColor || '#2b7a4b';
      var headerText = attributes.headerText;
      var section1Title = attributes.section1Title;
      var section1Intro = attributes.section1Intro;
      var checksList = attributes.checksList;
      var section2Title = attributes.section2Title;
      var section2Text = attributes.section2Text;
      var borderColor = attributes.borderColor || '#0f2744';

      var blockProps = useBlockProps.save( {
        className: 'mcp-verification-box',
        style: { borderColor: borderColor }
      } );

      return el(
        'div',
        blockProps,
        ribbonText && el(
          'div',
          {
            className: 'mcp-corner-ribbon',
            style: { backgroundColor: ribbonBgColor }
          },
          ribbonText
        ),
        el( RichText.Content, {
          tagName: 'div',
          className: 'mcp-verification-header',
          value: headerText
        } ),
        el( 'hr', { className: 'mcp-verification-divider' } ),
        el( RichText.Content, {
          tagName: 'h4',
          className: 'mcp-verification-section-title',
          value: section1Title
        } ),
        el( RichText.Content, {
          tagName: 'p',
          className: 'mcp-verification-intro',
          value: section1Intro
        } ),
        el( RichText.Content, {
          tagName: 'ul',
          className: 'mcp-verification-list',
          value: checksList
        } ),
        el( RichText.Content, {
          tagName: 'h4',
          className: 'mcp-verification-limitations-title',
          value: section2Title
        } ),
        el( RichText.Content, {
          tagName: 'p',
          className: 'mcp-verification-limitations-text',
          value: section2Text
        } )
      );
    }
  } );
} )( window.wp );
