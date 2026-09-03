<?php
/**
 * Plugin Name:       Modern Table Block
 * Plugin URI:        https://example.com/modern-table-block
 * Description:       A modern, responsive table block for the Gutenberg Block Editor with custom presets and styles.
 * Version:           1.0.0
 * Author:            Mahfujur Rahman
 * License:           GPL-2.0+
 * Text Domain:       my-custom-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Prevent direct file access
}

/**
 * Registers the Modern Table block type using metadata from blocks/table/block.json.
 */
function mcp_register_table_block() {
	register_block_type( __DIR__ . '/blocks/table' );
}
add_action( 'init', 'mcp_register_table_block' );