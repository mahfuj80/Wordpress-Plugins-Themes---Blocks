<?php
/**
 * Dynamic frontend render callback for Table of Contents block.
 * Dynamically extracts headings from the current blog post content.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$title          = isset( $attributes['title'] ) && '' !== trim( $attributes['title'] ) ? $attributes['title'] : '📋 In This Guide';
$columns        = isset( $attributes['columns'] ) ? max( 1, min( 4, (int) $attributes['columns'] ) ) : 2;
$link_color     = isset( $attributes['linkColor'] ) ? $attributes['linkColor'] : '#7c3aed';
$include_h2     = ! isset( $attributes['includeH2'] ) || $attributes['includeH2'];
$include_h3     = ! isset( $attributes['includeH3'] ) || $attributes['includeH3'];
$include_h4     = isset( $attributes['includeH4'] ) && $attributes['includeH4'];
$hidden_ids     = isset( $attributes['hiddenHeadings'] ) && is_array( $attributes['hiddenHeadings'] ) ? $attributes['hiddenHeadings'] : array();

// 1. Get the current blog post content
$post_id = get_the_ID();
$post    = $post_id ? get_post( $post_id ) : null;
$content = $post ? $post->post_content : '';

$headings = array();

// 2. Automatically parse all headings from the blog post
if ( ! empty( $content ) ) {
	preg_match_all( '/<h([2-4])([^>]*)>(.*?)<\/h\1>/is', $content, $matches, PREG_SET_ORDER );

	foreach ( $matches as $m ) {
		$level = (int) $m[1];

		// Check heading level filters
		if ( 2 === $level && ! $include_h2 ) {
			continue;
		}
		if ( 3 === $level && ! $include_h3 ) {
			continue;
		}
		if ( 4 === $level && ! $include_h4 ) {
			continue;
		}

		$text = wp_strip_all_tags( $m[3] );
		$text = trim( $text );
		if ( empty( $text ) ) {
			continue;
		}

		// Get or generate anchor slug
		if ( preg_match( '/\bid\s*=\s*["\']([^"\']+)["\']/i', $m[2], $id_match ) ) {
			$id = $id_match[1];
		} else {
			$id = sanitize_title( $text );
		}

		// Check if user hid this heading
		if ( in_array( $id, $hidden_ids, true ) ) {
			continue;
		}

		$headings[] = array(
			'id'    => $id,
			'text'  => $text,
			'level' => $level,
		);
	}
}

// 3. Fallback to saved attribute headings if post_content is not accessible yet
if ( empty( $headings ) && ! empty( $attributes['headings'] ) && is_array( $attributes['headings'] ) ) {
	foreach ( $attributes['headings'] as $h ) {
		$level = isset( $h['level'] ) ? (int) $h['level'] : 2;
		if ( 2 === $level && ! $include_h2 ) {
			continue;
		}
		if ( 3 === $level && ! $include_h3 ) {
			continue;
		}
		if ( 4 === $level && ! $include_h4 ) {
			continue;
		}

		$id = isset( $h['id'] ) ? $h['id'] : sanitize_title( $h['text'] );
		if ( in_array( $id, $hidden_ids, true ) ) {
			continue;
		}

		$headings[] = array(
			'id'    => $id,
			'text'  => $h['text'],
			'level' => $level,
		);
	}
}

$custom_labels = isset( $attributes['customLabels'] ) && is_array( $attributes['customLabels'] ) ? $attributes['customLabels'] : array();
$custom_links  = isset( $attributes['customLinks'] ) && is_array( $attributes['customLinks'] ) ? $attributes['customLinks'] : array();

// Apply custom link text overrides
foreach ( $headings as &$h ) {
	if ( isset( $custom_labels[ $h['id'] ] ) && '' !== trim( $custom_labels[ $h['id'] ] ) ) {
		$h['text'] = $custom_labels[ $h['id'] ];
	}
}
unset( $h );

// Append any manual custom links
if ( ! empty( $custom_links ) ) {
	foreach ( $custom_links as $cl ) {
		if ( empty( $cl['text'] ) ) {
			continue;
		}
		$url        = ! empty( $cl['url'] ) ? $cl['url'] : '#';
		$headings[] = array(
			'id'    => ltrim( $url, '#' ),
			'url'   => $url,
			'text'  => $cl['text'],
			'level' => 2,
		);
	}
}

// If no headings exist in the post, do not render an empty container on the live site
if ( empty( $headings ) ) {
	return;
}
?>
<nav class="mcp-toc-container">
	<div class="mcp-toc-title"><?php echo wp_kses_post( $title ); ?></div>
	<ul class="mcp-toc-list" style="--mcp-toc-cols: <?php echo esc_attr( $columns ); ?>; --mcp-toc-link-color: <?php echo esc_attr( $link_color ); ?>;">
		<?php foreach ( $headings as $h ) : ?>
			<?php $href = isset( $h['url'] ) ? $h['url'] : ( '#' . $h['id'] ); ?>
			<li class="mcp-toc-item">
				<a href="<?php echo esc_attr( $href ); ?>" class="mcp-toc-link" style="color: <?php echo esc_attr( $link_color ); ?>;">
					<?php echo esc_html( $h['text'] ); ?>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>
</nav>
