<?php
/**
 * Dynamic Server-Side Render for IPTV Pricing & Packages Block
 * SEO-Optimized with Semantic HTML, Schema.org Structured Data, and 100% Crawlable Markup.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Attributes extraction
$api_url            = isset( $attributes['apiUrl'] ) ? esc_url_raw( trim( $attributes['apiUrl'] ) ) : '';
$auto_fetch         = ! empty( $attributes['autoFetchFrontend'] );
$theme_preset       = isset( $attributes['themePreset'] ) ? sanitize_html_class( $attributes['themePreset'] ) : 'dark-nebula';
$accent_color       = isset( $attributes['accentColor'] ) ? sanitize_hex_color( $attributes['accentColor'] ) : '#d6287c';
$accent_text_color  = isset( $attributes['accentTextColor'] ) ? sanitize_hex_color( $attributes['accentTextColor'] ) : '#ffffff';
$bg_color           = isset( $attributes['bgColor'] ) ? sanitize_hex_color( $attributes['bgColor'] ) : '#0b0f19';
$card_bg_color      = isset( $attributes['cardBgColor'] ) ? sanitize_hex_color( $attributes['cardBgColor'] ) : '#111827';
$card_border_color  = isset( $attributes['cardBorderColor'] ) ? esc_attr( $attributes['cardBorderColor'] ) : 'rgba(255, 255, 255, 0.14)';
$title_color        = isset( $attributes['titleColor'] ) ? sanitize_hex_color( $attributes['titleColor'] ) : '#ffffff';
$text_color         = isset( $attributes['textColor'] ) ? sanitize_hex_color( $attributes['textColor'] ) : '#cbd5e1';
$price_bg_color     = isset( $attributes['priceBgColor'] ) ? sanitize_hex_color( $attributes['priceBgColor'] ) : '#d6287c';
$price_text_color   = isset( $attributes['priceTextColor'] ) ? sanitize_hex_color( $attributes['priceTextColor'] ) : '#ffffff';
$btn_bg_color       = isset( $attributes['buttonBgColor'] ) ? sanitize_hex_color( $attributes['buttonBgColor'] ) : '#d6287c';
$btn_text_color     = isset( $attributes['buttonTextColor'] ) ? sanitize_hex_color( $attributes['buttonTextColor'] ) : '#ffffff';
$btn_hover_color    = isset( $attributes['buttonHoverBgColor'] ) ? sanitize_hex_color( $attributes['buttonHoverBgColor'] ) : '#be185d';
$border_radius      = isset( $attributes['borderRadius'] ) ? (int) $attributes['borderRadius'] : 14;

$badge              = isset( $attributes['badge'] ) ? esc_html( $attributes['badge'] ) : 'Nixon IPTV Subscriptions';
$title              = isset( $attributes['title'] ) ? esc_html( $attributes['title'] ) : 'Pick Your Nixon IPTV Plan';
$subtitle           = isset( $attributes['subtitle'] ) ? esc_html( $attributes['subtitle'] ) : 'The longer you subscribe, the more you save. All plans include the same premium content just choose what works for you.';
$currency           = isset( $attributes['currencySymbol'] ) ? esc_html( $attributes['currencySymbol'] ) : '$';
$button_text        = isset( $attributes['buttonText'] ) ? esc_html( $attributes['buttonText'] ) : 'Order Now';
$delivery_badge     = isset( $attributes['deliveryBadge'] ) ? esc_html( $attributes['deliveryBadge'] ) : 'Instant Delivery';
$m3u_tab_label      = isset( $attributes['m3uTabLabel'] ) ? esc_html( $attributes['m3uTabLabel'] ) : 'M3U Playlist';
$mag_tab_label      = isset( $attributes['magTabLabel'] ) ? esc_html( $attributes['magTabLabel'] ) : 'MAG / Portal';
$columns_desktop    = isset( $attributes['columnsDesktop'] ) ? max( 1, min( 6, (int) $attributes['columnsDesktop'] ) ) : 4;
$default_conn       = isset( $attributes['defaultConnectionType'] ) ? $attributes['defaultConnectionType'] : 'M3U';
$default_dev        = isset( $attributes['defaultDevices'] ) ? (int) $attributes['defaultDevices'] : 1;
$open_new_tab       = ! isset( $attributes['openLinksInNewTab'] ) || $attributes['openLinksInNewTab'];

// SEO Configuration
$heading_tag        = isset( $attributes['headingTag'] ) && in_array( $attributes['headingTag'], array( 'h1', 'h2', 'h3', 'h4' ), true ) ? $attributes['headingTag'] : 'h2';
$card_heading_tag   = isset( $attributes['cardHeadingTag'] ) && in_array( $attributes['cardHeadingTag'], array( 'h2', 'h3', 'h4', 'h5', 'div' ), true ) ? $attributes['cardHeadingTag'] : 'h3';
$link_rel           = isset( $attributes['linkRel'] ) ? esc_attr( $attributes['linkRel'] ) : 'sponsored nofollow noopener';
$enable_schema      = ! isset( $attributes['enableSchema'] ) || $attributes['enableSchema'];

// Retrieve packages from API cache or block attributes
$packages = isset( $attributes['packages'] ) && is_array( $attributes['packages'] ) ? $attributes['packages'] : array();

if ( ! empty( $api_url ) ) {
	$transient_key = 'iptv_pkg_' . md5( $api_url );
	$cached_data   = get_transient( $transient_key );

	if ( false !== $cached_data && is_array( $cached_data ) && ! empty( $cached_data ) ) {
		$packages = $cached_data;
	} else {
		$try_urls = array( $api_url );
		if ( preg_match( '#^https?://(localhost|127\.0\.0\.1)(:\d+)?#i', $api_url, $m ) ) {
			$port = isset( $m[2] ) ? $m[2] : '';
			$try_urls[] = preg_replace( '#^https?://(localhost|127\.0\.0\.1)(:\d+)?#i', 'http://host.docker.internal' . $port, $api_url );
		}

		foreach ( $try_urls as $target_url ) {
			$response = wp_remote_get( $target_url, array( 'timeout' => 8, 'sslverify' => false ) );
			if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
				$body = wp_remote_retrieve_body( $response );
				$data = json_decode( $body, true );
				if ( is_array( $data ) ) {
					$fetched_packages = isset( $data['packages'] ) ? $data['packages'] : ( isset( $data['data'] ) ? $data['data'] : $data );
					if ( is_array( $fetched_packages ) && ! empty( $fetched_packages ) ) {
						$packages = $fetched_packages;
						set_transient( $transient_key, $packages, HOUR_IN_SECONDS );
						break;
					}
				}
			}
		}
	}
}

// Compute available devices for default connection type for SSR markup
$available_devices = array();
foreach ( $packages as $pkg ) {
	if ( empty( $pkg['active'] ) || ! empty( $pkg['isDeleted'] ) ) {
		continue;
	}
	$c_type   = isset( $pkg['connectionType'] ) ? strtoupper( $pkg['connectionType'] ) : 'M3U';
	$is_match = ( 'BOTH' === $c_type ) ||
		( 'M3U' === $default_conn && 'M3U' === $c_type ) ||
		( 'MAG' === $default_conn && ( 'MAC' === $c_type || 'MAG' === $c_type ) );

	if ( $is_match ) {
		$dev = isset( $pkg['devices'] ) ? (int) $pkg['devices'] : 1;
		if ( ! in_array( $dev, $available_devices, true ) ) {
			$available_devices[] = $dev;
		}
	}
}
sort( $available_devices );
if ( ! in_array( $default_dev, $available_devices, true ) && ! empty( $available_devices ) ) {
	$default_dev = $available_devices[0];
}

// Prepare configuration payload for view.js
$frontend_config = array(
	'apiUrl'                => $api_url,
	'autoFetchFrontend'     => $auto_fetch,
	'columnsDesktop'        => $columns_desktop,
	'defaultConnectionType' => $default_conn,
	'defaultDevices'        => $default_dev,
	'currencySymbol'        => $currency,
	'buttonText'            => $button_text,
	'deliveryBadge'         => $delivery_badge,
	'openLinksInNewTab'     => $open_new_tab,
	'linkRel'               => $link_rel,
	'packages'              => $packages,
);

// Inline style variables
$style_vars = sprintf(
	'--iptv-accent: %s; --iptv-accent-text: %s; --iptv-bg: %s; --iptv-card-bg: %s; --iptv-card-border: %s; --iptv-title-color: %s; --iptv-text-color: %s; --iptv-price-bg: %s; --iptv-price-text: %s; --iptv-btn-bg: %s; --iptv-btn-text: %s; --iptv-btn-hover: %s; --iptv-radius: %dpx; --iptv-cols: %d;',
	$accent_color,
	$accent_text_color,
	$bg_color,
	$card_bg_color,
	$card_border_color,
	$title_color,
	$text_color,
	$price_bg_color,
	$price_text_color,
	$btn_bg_color,
	$btn_text_color,
	$btn_hover_color,
	$border_radius,
	$columns_desktop
);

$wrapper_classes = 'iptv-pricing-block theme-' . $theme_preset;
?>

<section class="<?php echo esc_attr( $wrapper_classes ); ?>" style="<?php echo esc_attr( $style_vars ); ?>" aria-label="<?php echo esc_attr( $title ); ?>">
	<div class="iptv-container">

		<!-- Header with semantic tag & customizable heading level -->
		<header class="iptv-header">
			<?php if ( ! empty( $badge ) ) : ?>
				<span class="iptv-badge"><?php echo esc_html( $badge ); ?></span>
			<?php endif; ?>
			<?php if ( ! empty( $title ) ) : ?>
				<<?php echo esc_html( $heading_tag ); ?> class="iptv-title">
					<?php echo esc_html( $title ); ?>
				</<?php echo esc_html( $heading_tag ); ?>>
			<?php endif; ?>
			<?php if ( ! empty( $subtitle ) ) : ?>
				<p class="iptv-subtitle"><?php echo esc_html( $subtitle ); ?></p>
			<?php endif; ?>
		</header>

		<!-- Filters Section -->
		<div class="iptv-filters">
			<!-- Level 1: Connection Type Switcher -->
			<div class="iptv-conn-switcher" role="tablist" aria-label="<?php esc_attr_e( 'Connection Types', 'my-custom-plugin' ); ?>">
				<button
					type="button"
					role="tab"
					class="iptv-conn-btn <?php echo ( 'M3U' === $default_conn ) ? 'is-active' : ''; ?>"
					data-conn="M3U"
					aria-selected="<?php echo ( 'M3U' === $default_conn ) ? 'true' : 'false'; ?>">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9"/><path d="m15 15 6 6"/><path d="m21 15-6 6"/></svg>
					<?php echo esc_html( $m3u_tab_label ); ?>
				</button>
				<button
					type="button"
					role="tab"
					class="iptv-conn-btn <?php echo ( 'MAG' === $default_conn ) ? 'is-active' : ''; ?>"
					data-conn="MAG"
					aria-selected="<?php echo ( 'MAG' === $default_conn ) ? 'true' : 'false'; ?>">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
					<?php echo esc_html( $mag_tab_label ); ?>
				</button>
			</div>

			<!-- Level 2: Device Count Pills -->
			<div class="iptv-device-selector" role="group" aria-label="<?php esc_attr_e( 'Device Count Filter', 'my-custom-plugin' ); ?>">
				<?php foreach ( $available_devices as $dev ) : ?>
					<button
						type="button"
						class="iptv-device-btn <?php echo ( $dev === $default_dev ) ? 'is-active' : ''; ?>"
						data-device="<?php echo esc_attr( $dev ); ?>"
						aria-pressed="<?php echo ( $dev === $default_dev ) ? 'true' : 'false'; ?>">
						<?php echo esc_html( $dev . ( 1 === $dev ? ' Device' : ' Devices' ) ); ?>
					</button>
				<?php endforeach; ?>
			</div>
		</div>

		<!-- Packages Grid & Carousel Container -->
		<div class="iptv-grid-wrapper">
			<!-- Carousel Nav Arrows -->
			<button type="button" class="iptv-carousel-nav is-prev" aria-label="<?php esc_attr_e( 'Previous Plans', 'my-custom-plugin' ); ?>" style="display: none;">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
			</button>
			<button type="button" class="iptv-carousel-nav is-next" aria-label="<?php esc_attr_e( 'Next Plans', 'my-custom-plugin' ); ?>" style="display: none;">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
			</button>

			<div class="iptv-cards-viewport">
				<div class="iptv-cards-track is-grid">
					<?php foreach ( $packages as $pkg ) : ?>
						<?php
						if ( empty( $pkg['active'] ) || ! empty( $pkg['isDeleted'] ) ) {
							continue;
						}
						$c_type      = isset( $pkg['connectionType'] ) ? strtoupper( $pkg['connectionType'] ) : 'M3U';
						$pkg_dev     = isset( $pkg['devices'] ) ? (int) $pkg['devices'] : 1;
						$conn_match  = ( 'BOTH' === $c_type ) ||
							( 'M3U' === $default_conn && 'M3U' === $c_type ) ||
							( 'MAG' === $default_conn && ( 'MAC' === $c_type || 'MAG' === $c_type ) );
						$dev_match   = $pkg_dev === $default_dev;
						$is_visible  = $conn_match && $dev_match;
						$conn_cat    = ( 'MAC' === $c_type || 'MAG' === $c_type ) ? 'MAG' : ( 'BOTH' === $c_type ? 'BOTH' : 'M3U' );

						$pkg_name    = ! empty( $pkg['name'] ) ? $pkg['name'] : ( ( ! empty( $pkg['months'] ) ? $pkg['months'] : 1 ) . ' Months' );
						$pkg_price   = isset( $pkg['price'] ) ? $pkg['price'] : 0;
						$pkg_link    = ! empty( $pkg['packageLink'] ) ? $pkg['packageLink'] : ( ! empty( $pkg['paymentLink'] ) ? $pkg['paymentLink'] : ( ! empty( $pkg['directLink'] ) ? $pkg['directLink'] : '#' ) );
						$is_popular  = ! empty( $pkg['popular'] );
						$features    = ! empty( $pkg['features'] ) && is_array( $pkg['features'] ) ? $pkg['features'] : array(
							'15,000+ Live TV Channels',
							'1,30,000+ Movies',
							'34,000+ Series',
							'HD, FHD & 4K Channels',
							'TV Guide (EPG)',
							'100% Up-time',
							'24/7 Support',
						);
						?>
						<article
							class="iptv-card <?php echo $is_popular ? 'is-popular' : ''; ?>"
							data-conn="<?php echo esc_attr( $conn_cat ); ?>"
							data-device="<?php echo esc_attr( $pkg_dev ); ?>"
							style="<?php echo $is_visible ? '' : 'display: none;'; ?>">
							<?php if ( $is_popular ) : ?>
								<div class="iptv-popular-ribbon"><?php esc_html_e( 'Popular', 'my-custom-plugin' ); ?></div>
							<?php endif; ?>

							<div class="iptv-card-header">
								<<?php echo esc_html( $card_heading_tag ); ?> class="iptv-card-title">
									<?php echo esc_html( $pkg_name ); ?>
								</<?php echo esc_html( $card_heading_tag ); ?>>
								<?php if ( ! empty( $pkg['description'] ) ) : ?>
									<p class="iptv-card-desc"><?php echo esc_html( $pkg['description'] ); ?></p>
								<?php endif; ?>
							</div>

							<div class="iptv-price-banner">
								<div class="iptv-price-val">
									<span class="iptv-currency"><?php echo esc_html( $currency ); ?></span>
									<span><?php echo esc_html( $pkg_price ); ?></span>
								</div>
								<div class="iptv-duration-label">
									<?php
									if ( ! empty( $pkg['hours'] ) && empty( $pkg['months'] ) ) {
										echo esc_html( $pkg['hours'] . ' Hours Access' );
									} else {
										$m = ! empty( $pkg['months'] ) ? (int) $pkg['months'] : 1;
										echo esc_html( ( $m * 30 ) . ' Days' );
									}
									?>
								</div>
							</div>

							<ul class="iptv-features">
								<?php foreach ( $features as $feat ) : ?>
									<li class="iptv-feature-item">
										<svg class="iptv-check-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
										</svg>
										<span><?php echo esc_html( $feat ); ?></span>
									</li>
								<?php endforeach; ?>
							</ul>

							<footer class="iptv-card-footer">
								<a
									href="<?php echo esc_url( $pkg_link ); ?>"
									class="iptv-btn-order"
									rel="<?php echo esc_attr( $link_rel ); ?>"
									<?php echo $open_new_tab ? 'target="_blank"' : ''; ?>>
									<?php echo esc_html( $button_text ); ?>
								</a>
								<?php if ( ! empty( $delivery_badge ) ) : ?>
									<div class="iptv-delivery-note"><?php echo esc_html( $delivery_badge ); ?></div>
								<?php endif; ?>
							</footer>
						</article>
					<?php endforeach; ?>
				</div>
			</div>

			<!-- Carousel Pagination Dots -->
			<div class="iptv-carousel-dots" style="display: none;"></div>
		</div>

		<!-- Client Payload Data for view.js -->
		<script type="application/json" class="iptv-packages-data">
			<?php echo wp_json_encode( $frontend_config ); ?>
		</script>

		<!-- Schema.org Structured Data (JSON-LD) for Search Engine Rich Snippets -->
		<?php if ( $enable_schema && ! empty( $packages ) ) : ?>
			<?php
			$schema_items = array();
			$pos          = 1;
			foreach ( $packages as $pkg ) {
				if ( empty( $pkg['active'] ) || ! empty( $pkg['isDeleted'] ) ) {
					continue;
				}
				$pkg_title   = ! empty( $pkg['name'] ) ? $pkg['name'] : ( ( ! empty( $pkg['months'] ) ? $pkg['months'] : 1 ) . ' Months IPTV Plan' );
				$pkg_desc    = ! empty( $pkg['description'] ) ? $pkg['description'] : ( $pkg_title . ' with premium live channels, movies, and TV series' );
				$pkg_pr      = isset( $pkg['price'] ) ? (float) $pkg['price'] : 0.0;
				$pkg_url     = ! empty( $pkg['packageLink'] ) ? $pkg['packageLink'] : ( ! empty( $pkg['paymentLink'] ) ? $pkg['paymentLink'] : ( ! empty( $pkg['directLink'] ) ? $pkg['directLink'] : '' ) );
				$pkg_type    = isset( $pkg['connectionType'] ) ? $pkg['connectionType'] : 'IPTV';

				$schema_items[] = array(
					'@type'    => 'ListItem',
					'position' => $pos++,
					'item'     => array(
						'@type'       => 'Product',
						'name'        => $pkg_title,
						'description' => $pkg_desc,
						'category'    => $pkg_type,
						'offers'      => array(
							'@type'         => 'Offer',
							'price'         => $pkg_pr,
							'priceCurrency' => 'USD',
							'availability'  => 'https://schema.org/InStock',
							'url'           => esc_url( $pkg_url ),
						),
					),
				);
			}

			$schema_data = array(
				'@context'        => 'https://schema.org',
				'@type'           => 'ItemList',
				'name'            => ! empty( $title ) ? $title : 'IPTV Subscription Plans',
				'itemListElement' => $schema_items,
			);
			?>
			<script type="application/ld+json">
				<?php echo wp_json_encode( $schema_data ); ?>
			</script>
		<?php endif; ?>

	</div>
</section>
