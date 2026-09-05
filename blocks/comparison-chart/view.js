/**
 * Frontend Interactivity for Comparison Chart Block
 * Handles NN/g "Show Only Differences" filter, mobile touch tooltips, and horizontal swipe states.
 */
document.addEventListener('DOMContentLoaded', function() {
  var charts = document.querySelectorAll('.mcp-comparison-chart-wrapper');
  if (!charts.length) return;

  charts.forEach(function(chart) {
    var diffBtn = chart.querySelector('.mcp-cc-diff-filter');
    var table = chart.querySelector('.mcp-cc-table');
    if (!diffBtn || !table) return;

    var rows = table.querySelectorAll('tbody tr:not(.mcp-cc-category-row)');

    // NN/g "Show Only Differences" Filter Logic
    diffBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var isActive = diffBtn.classList.toggle('is-active');

      rows.forEach(function(row) {
        var cells = row.querySelectorAll('td');
        if (cells.length < 2) return;

        // Check if all cells in this row share the identical value / state
        var firstVal = getCellComparisonValue(cells[0]);
        var allIdentical = true;

        for (var i = 1; i < cells.length; i++) {
          if (getCellComparisonValue(cells[i]) !== firstVal) {
            allIdentical = false;
            break;
          }
        }

        // If all cells are identical, hide the row when filter is active
        if (allIdentical) {
          if (isActive) {
            row.classList.add('is-hidden-by-diff');
          } else {
            row.classList.remove('is-hidden-by-diff');
          }
        }
      });
    });

    // Mobile scroll indicator dismissal on first user scroll
    var scrollContainer = chart.querySelector('.mcp-cc-scroll-container');
    var mobileHint = chart.querySelector('.mcp-cc-mobile-hint');
    if (scrollContainer && mobileHint) {
      scrollContainer.addEventListener('scroll', function() {
        if (scrollContainer.scrollLeft > 20) {
          mobileHint.style.opacity = '0';
          setTimeout(function() { mobileHint.style.display = 'none'; }, 300);
        }
      }, { once: true, passive: true });
    }

    // Touch device tooltip trigger
    var tooltips = chart.querySelectorAll('.mcp-cc-tooltip-trigger');
    tooltips.forEach(function(tip) {
      tip.addEventListener('click', function(e) {
        e.stopPropagation();
        var content = tip.querySelector('.mcp-cc-tooltip-content');
        if (!content) return;
        var isVisible = content.style.visibility === 'visible';
        // Close other open tooltips
        document.querySelectorAll('.mcp-cc-tooltip-content').forEach(function(c) {
          c.style.visibility = '';
          c.style.opacity = '';
        });
        if (!isVisible) {
          content.style.visibility = 'visible';
          content.style.opacity = '1';
        }
      });
    });
  });

  // Global click outside to dismiss tooltips
  document.addEventListener('click', function() {
    document.querySelectorAll('.mcp-cc-tooltip-content').forEach(function(c) {
      c.style.visibility = '';
      c.style.opacity = '';
    });
  });

  // Helper: Extract a comparable string signature from a cell
  function getCellComparisonValue(td) {
    if (!td) return '';
    var check = td.querySelector('.mcp-cc-icon-check');
    var cross = td.querySelector('.mcp-cc-icon-cross');
    var dash = td.querySelector('.mcp-cc-icon-dash');
    var text = td.textContent.trim().toLowerCase();

    if (check) return 'check:' + text;
    if (cross) return 'cross:' + text;
    if (dash) return 'dash:' + text;
    return 'text:' + text;
  }
});
