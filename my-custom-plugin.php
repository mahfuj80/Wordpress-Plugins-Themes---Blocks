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
	register_block_type( __DIR__ . '/blocks/comparison-chart' );
	register_block_type( __DIR__ . '/blocks/faq' );
	register_block_type( __DIR__ . '/blocks/iptv-pricing' );
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

/**
 * Registers REST API proxy endpoint to fetch IPTV packages, bypassing browser CORS.
 */
function mcp_register_iptv_proxy_route() {
	register_rest_route( 'my-custom-plugin/v1', '/proxy-packages', array(
		'methods'             => 'GET',
		'callback'            => 'mcp_proxy_iptv_packages',
		'permission_callback' => '__return_true',
		'args'                => array(
			'url' => array(
				'required'          => true,
				'sanitize_callback' => 'esc_url_raw',
			),
		),
	) );
}
add_action( 'rest_api_init', 'mcp_register_iptv_proxy_route' );

/**
 * Proxies an external API request on the server side to eliminate browser CORS restrictions.
 */
function mcp_proxy_iptv_packages( $request ) {
	$url = $request->get_param( 'url' );
	if ( empty( $url ) ) {
		return new WP_Error( 'invalid_url', 'URL parameter is required', array( 'status' => 400 ) );
	}

	$try_urls = array( $url );
	// Support Docker environments (wp-env) where localhost refers to host.docker.internal
	if ( preg_match( '#^https?://(localhost|127\.0\.0\.1)(:\d+)?#i', $url, $m ) ) {
		$port = isset( $m[2] ) ? $m[2] : '';
		$try_urls[] = preg_replace( '#^https?://(localhost|127\.0\.0\.1)(:\d+)?#i', 'http://host.docker.internal' . $port, $url );
	}

	$last_error = '';
	foreach ( $try_urls as $target_url ) {
		$response = wp_remote_get( $target_url, array(
			'timeout'   => 12,
			'sslverify' => false,
		) );

		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$body = wp_remote_retrieve_body( $response );
			$data = json_decode( $body, true );
			if ( is_array( $data ) ) {
				$packages = isset( $data['packages'] ) ? $data['packages'] : ( isset( $data['data'] ) ? $data['data'] : $data );
				if ( is_array( $packages ) ) {
					return rest_ensure_response( array(
						'success'  => true,
						'packages' => array_values( $packages ),
						'count'    => count( $packages ),
					) );
				}
			}
		} else {
			$last_error = is_wp_error( $response ) ? $response->get_error_message() : ( 'HTTP ' . wp_remote_retrieve_response_code( $response ) );
		}
	}

	return new WP_Error( 'fetch_failed', 'Failed to fetch packages from API: ' . ( $last_error ?: 'Unknown error' ), array( 'status' => 502 ) );
}