/**
 * Frontend script for FAQ & Accordion Suite Block.
 * Handles single/multi accordion expansion, keyboard navigation, and initial open states.
 */
( function() {
  'use strict';

  function initFaqBlocks() {
    var faqContainers = document.querySelectorAll( '.mcp-faq-wrapper' );

    faqContainers.forEach( function( container ) {
      // Prevent duplicate initialization
      if ( container.dataset.mcpFaqInitialized ) return;
      container.dataset.mcpFaqInitialized = 'true';

      var behavior = container.getAttribute( 'data-behavior' ) || 'accordion';
      var initialState = container.getAttribute( 'data-initial' ) || 'first-open';
      var items = container.querySelectorAll( '.mcp-faq-item' );

      if ( ! items.length ) return;

      // Handle Initial Open State
      if ( initialState === 'first-open' && items[ 0 ] ) {
        openItem( items[ 0 ] );
      } else if ( initialState === 'all-open' ) {
        items.forEach( function( item ) {
          openItem( item );
        } );
      }

      // Attach Click & Keyboard Triggers
      container.addEventListener( 'click', function( event ) {
        var trigger = event.target.closest( '.mcp-faq-trigger' );
        if ( ! trigger || ! container.contains( trigger ) ) return;

        var item = trigger.closest( '.mcp-faq-item' );
        if ( ! item ) return;

        var isOpen = item.classList.contains( 'mcp-is-open' );

        if ( isOpen ) {
          closeItem( item );
        } else {
          if ( behavior === 'accordion' ) {
            // Close all sibling items in accordion mode
            items.forEach( function( sibling ) {
              if ( sibling !== item && sibling.classList.contains( 'mcp-is-open' ) ) {
                closeItem( sibling );
              }
            } );
          }
          openItem( item );
        }
      } );

      // Keyboard Accessibility: Arrow navigation between triggers
      container.addEventListener( 'keydown', function( event ) {
        var trigger = event.target.closest( '.mcp-faq-trigger' );
        if ( ! trigger ) return;

        var triggers = Array.prototype.slice.call( container.querySelectorAll( '.mcp-faq-trigger' ) );
        var currentIndex = triggers.indexOf( trigger );
        if ( currentIndex === -1 ) return;

        if ( event.key === 'ArrowDown' ) {
          event.preventDefault();
          var nextIndex = ( currentIndex + 1 ) % triggers.length;
          triggers[ nextIndex ].focus();
        } else if ( event.key === 'ArrowUp' ) {
          event.preventDefault();
          var prevIndex = ( currentIndex - 1 + triggers.length ) % triggers.length;
          triggers[ prevIndex ].focus();
        } else if ( event.key === 'Home' ) {
          event.preventDefault();
          triggers[ 0 ].focus();
        } else if ( event.key === 'End' ) {
          event.preventDefault();
          triggers[ triggers.length - 1 ].focus();
        }
      } );
    } );
  }

  function openItem( item ) {
    item.classList.add( 'mcp-is-open' );
    var trigger = item.querySelector( '.mcp-faq-trigger' );
    if ( trigger ) {
      trigger.setAttribute( 'aria-expanded', 'true' );
    }
  }

  function closeItem( item ) {
    item.classList.remove( 'mcp-is-open' );
    var trigger = item.querySelector( '.mcp-faq-trigger' );
    if ( trigger ) {
      trigger.setAttribute( 'aria-expanded', 'false' );
    }
  }

  if ( document.readyState === 'loading' ) {
    document.addEventListener( 'DOMContentLoaded', initFaqBlocks );
  } else {
    initFaqBlocks();
  }
} )();
