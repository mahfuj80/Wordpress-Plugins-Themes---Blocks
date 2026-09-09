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
 * Injects global plugin configuration to Gutenberg Block Editor assets.
 */
function mcp_iptv_enqueue_editor_assets() {
	$config = array(
		'globalApiUrl' => get_option( 'mcp_iptv_api_url', '' ),
		'restProxyUrl' => rest_url( 'my-custom-plugin/v1/proxy-packages' ),
		'cacheTtl'     => (int) get_option( 'mcp_iptv_cache_ttl', 60 ),
	);
	wp_add_inline_script(
		'wp-blocks',
		'window.mcpIptvGlobalConfig = ' . wp_json_encode( $config ) . ';',
		'before'
	);
}
add_action( 'enqueue_block_editor_assets', 'mcp_iptv_enqueue_editor_assets' );

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
				'required'          => false,
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
		$url = get_option( 'mcp_iptv_api_url', '' );
	}

	if ( empty( $url ) ) {
		return new WP_Error(
			'invalid_url',
			'No API URL provided. Please provide a URL parameter or configure a Global API URL in Settings > IPTV Pricing.',
			array( 'status' => 400 )
		);
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
					$res = rest_ensure_response( array(
						'success'  => true,
						'packages' => array_values( $packages ),
						'count'    => count( $packages ),
					) );
					$res->header( 'Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0' );
					$res->header( 'Pragma', 'no-cache' );
					$res->header( 'Expires', '0' );
					return $res;
				}
			}
		} else {
			$last_error = is_wp_error( $response ) ? $response->get_error_message() : ( 'HTTP ' . wp_remote_retrieve_response_code( $response ) );
		}
	}

	return new WP_Error( 'fetch_failed', 'Failed to fetch packages from API: ' . ( $last_error ?: 'Unknown error' ), array( 'status' => 502 ) );
}

/**
 * Register Admin Settings Page for IPTV Pricing under Settings > IPTV Pricing.
 */
function mcp_iptv_register_settings_page() {
	add_options_page(
		__( 'IPTV Pricing Block Settings', 'my-custom-plugin' ),
		__( 'IPTV Pricing', 'my-custom-plugin' ),
		'manage_options',
		'mcp-iptv-settings',
		'mcp_iptv_render_settings_page'
	);
}
add_action( 'admin_menu', 'mcp_iptv_register_settings_page' );

/**
 * Register settings fields.
 */
function mcp_iptv_register_settings() {
	register_setting( 'mcp_iptv_settings_group', 'mcp_iptv_api_url', array(
		'type'              => 'string',
		'sanitize_callback' => 'esc_url_raw',
		'default'           => '',
	) );

	register_setting( 'mcp_iptv_settings_group', 'mcp_iptv_cache_ttl', array(
		'type'              => 'integer',
		'sanitize_callback' => 'absint',
		'default'           => 60,
	) );
}
add_action( 'admin_init', 'mcp_iptv_register_settings' );

/**
 * Render Admin Settings Page.
 */
function mcp_iptv_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	// Handle cache purge
	$cache_cleared = false;
	if ( isset( $_POST['mcp_purge_cache'] ) && check_admin_referer( 'mcp_purge_cache_nonce' ) ) {
		global $wpdb;
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_iptv_pkg_%' OR option_name LIKE '_transient_timeout_iptv_pkg_%'" );
		$cache_cleared = true;
	}

	$api_url   = get_option( 'mcp_iptv_api_url', '' );
	$cache_ttl = get_option( 'mcp_iptv_cache_ttl', 60 );
	?>
	<div class="wrap" style="max-width: 860px;">
		<h1><?php esc_html_e( 'IPTV Pricing Block Settings', 'my-custom-plugin' ); ?></h1>
		<p><?php esc_html_e( 'Configure the global IPTV packages API endpoint. When set, any IPTV Pricing block on your site automatically fetches live packages from this source on page refresh.', 'my-custom-plugin' ); ?></p>

		<?php if ( $cache_cleared ) : ?>
			<div class="notice notice-success is-dismissible">
				<p><strong><?php esc_html_e( 'Success:', 'my-custom-plugin' ); ?></strong> <?php esc_html_e( 'IPTV packages cache has been purged! All pages will fetch fresh packages on their next load.', 'my-custom-plugin' ); ?></p>
			</div>
		<?php endif; ?>

		<form method="post" action="options.php" style="background: #fff; padding: 24px; border: 1px solid #ccd0d4; border-radius: 8px; margin-top: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.04);">
			<?php
			settings_fields( 'mcp_iptv_settings_group' );
			do_settings_sections( 'mcp_iptv_settings_group' );
			?>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="mcp_iptv_api_url"><strong><?php esc_html_e( 'Global Packages API URL', 'my-custom-plugin' ); ?></strong></label>
					</th>
					<td>
						<input
							type="url"
							id="mcp_iptv_api_url"
							name="mcp_iptv_api_url"
							value="<?php echo esc_attr( $api_url ); ?>"
							class="regular-text"
							style="width: 100%; max-width: 520px;"
							placeholder="https://yourdomain.com/api/packages"
						/>
						<p class="description">
							<?php esc_html_e( 'Global fallback endpoint. Individual blocks can still override this with their own API URL if needed.', 'my-custom-plugin' ); ?>
						</p>
					</td>
				</tr>

				<tr>
					<th scope="row">
						<label for="mcp_iptv_cache_ttl"><strong><?php esc_html_e( 'Server Cache Duration (Seconds)', 'my-custom-plugin' ); ?></strong></label>
					</th>
					<td>
						<input
							type="number"
							id="mcp_iptv_cache_ttl"
							name="mcp_iptv_cache_ttl"
							value="<?php echo esc_attr( $cache_ttl ); ?>"
							min="0"
							max="86400"
							class="small-text"
						/>
						<p class="description">
							<?php esc_html_e( 'Server-side cache time in seconds (default: 60s). Set to 0 for always-live SSR. Logged-in admins and page reloads always fetch fresh live packages.', 'my-custom-plugin' ); ?>
						</p>
					</td>
				</tr>
			</table>

			<?php submit_button( __( 'Save Settings', 'my-custom-plugin' ) ); ?>
		</form>

		<div style="background: #fff; padding: 24px; border: 1px solid #ccd0d4; border-radius: 8px; margin-top: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.04);">
			<h2 style="margin-top: 0;"><?php esc_html_e( 'Quick Cache Flush', 'my-custom-plugin' ); ?></h2>
			<p><?php esc_html_e( 'If you just updated packages in your IPTV backend and want to immediately purge all server-side cached packages across all pages:', 'my-custom-plugin' ); ?></p>
			<form method="post" action="">
				<?php wp_nonce_field( 'mcp_purge_cache_nonce' ); ?>
				<input type="hidden" name="mcp_purge_cache" value="1" />
				<button type="submit" class="button button-secondary" style="color: #b32d2e; border-color: #b32d2e;">
					<?php esc_html_e( '⚡ Purge Packages Cache Now', 'my-custom-plugin' ); ?>
				</button>
			</form>
		</div>
	</div>
	<?php
}