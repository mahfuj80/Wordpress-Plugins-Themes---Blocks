<?php
/**
 * Plugin Name:       Review & Affiliate Blocks Suite
 * Plugin URI:        https://example.com/review-affiliate-blocks
 * Description:       A modern suite of Gutenberg blocks for review sites: Tables, Callouts (Disclosures & Logs), Verification Trust Badges, and Quick Picks Grids.
 * Version:           1.1.0
 * Author:            Mahfujur Rahman
 * License:           GPL-2.0+
 * Text Domain:       my-custom-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Prevent direct file access
}

/**
 * Registers all custom block types for the plugin.
 */
function mcp_register_all_blocks() {
	register_block_type( __DIR__ . '/blocks/table' );
	register_block_type( __DIR__ . '/blocks/callout' );
	register_block_type( __DIR__ . '/blocks/verification-box' );
	register_block_type( __DIR__ . '/blocks/quick-picks' );
	register_block_type( __DIR__ . '/blocks/table-of-contents' );
}
add_action( 'init', 'mcp_register_all_blocks' );

/**
 * Ensures all h2, h3, h4 headings in post content have matching anchor IDs for the Table of Contents.
 */
function mcp_add_heading_anchors( $content ) {
	if ( ! is_singular() ) {
		return $content;
	}

	return preg_replace_callback( '/<h([2-4])([^>]*)>(.*?)<\/h\1>/is', function( $matches ) {
		$level      = $matches[1];
		$attributes = $matches[2];
		$text       = $matches[3];

		// If an id attribute is already present, leave it intact
		if ( preg_match( '/\bid\s*=\s*["\']([^"\']+)["\']/i', $attributes ) ) {
			return $matches[0];
		}

		// Generate clean slug from heading text
		$clean_text = wp_strip_all_tags( $text );
		$id         = sanitize_title( $clean_text );

		return sprintf( '<h%1$s%2$s id="%3$s">%4$s</h%1$s>', $level, $attributes, esc_attr( $id ), $text );
	}, $content );
}
add_filter( 'the_content', 'mcp_add_heading_anchors' );