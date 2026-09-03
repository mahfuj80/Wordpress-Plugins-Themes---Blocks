/**
 * Frontend script for Table of Contents smooth scrolling.
 */
document.addEventListener( 'DOMContentLoaded', function() {
  document.addEventListener( 'click', function( event ) {
    var link = event.target.closest( '.mcp-toc-link' );
    if ( ! link ) return;

    var href = link.getAttribute( 'href' );
    if ( ! href || href.charAt( 0 ) !== '#' ) return;

    var targetId = decodeURIComponent( href.substring( 1 ) );
    var targetEl = document.getElementById( targetId );

    if ( targetEl ) {
      event.preventDefault();

      targetEl.scrollIntoView( {
        behavior: 'smooth',
        block: 'start'
      } );

      // Update URL hash without abrupt browser jump
      if ( window.history && window.history.pushState ) {
        window.history.pushState( null, null, href );
      }
    }
  } );
} );
