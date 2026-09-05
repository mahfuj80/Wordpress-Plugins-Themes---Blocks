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

    var diffMode = chart.getAttribute('data-diff-mode') || 'status';

    // NN/g "Show Only Differences" Filter Logic
    diffBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var isActive = diffBtn.classList.toggle('is-active');

      if (!isActive) {
        // Reset all rows and category headers back to visible
        table.querySelectorAll('tbody tr').forEach(function(row) {
          row.classList.remove('is-hidden-by-diff');
        });
        return;
      }

      // 1. Process regular feature rows
      var featureRows = table.querySelectorAll('tbody tr:not(.mcp-cc-category-row)');
      featureRows.forEach(function(row) {
        var cells = row.querySelectorAll('td');
        if (cells.length < 2) return;

        // Check if all cells in this row share the identical value / state
        var firstVal = getCellComparisonValue(cells[0], diffMode);
        var allIdentical = true;

        for (var i = 1; i < cells.length; i++) {
          if (getCellComparisonValue(cells[i], diffMode) !== firstVal) {
            allIdentical = false;
            break;
          }
        }

        // If all cells are identical, hide the row when filter is active
        if (allIdentical) {
          row.classList.add('is-hidden-by-diff');
        } else {
          row.classList.remove('is-hidden-by-diff');
        }
      });

      // 2. Process category headers: hide if all rows within that category section are hidden
      var catRows = table.querySelectorAll('tbody tr.mcp-cc-category-row');
      catRows.forEach(function(catRow) {
        var sibling = catRow.nextElementSibling;
        var hasVisibleChild = false;
        while (sibling && !sibling.classList.contains('mcp-cc-category-row')) {
          if (!sibling.classList.contains('is-hidden-by-diff')) {
            hasVisibleChild = true;
            break;
          }
          sibling = sibling.nextElementSibling;
        }
        if (!hasVisibleChild) {
          catRow.classList.add('is-hidden-by-diff');
        } else {
          catRow.classList.remove('is-hidden-by-diff');
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
  function getCellComparisonValue(td, diffMode) {
    if (!td) return '';
    var check = td.querySelector('.mcp-cc-icon-check');
    var cross = td.querySelector('.mcp-cc-icon-cross');
    var dash = td.querySelector('.mcp-cc-icon-dash');
    var ratingWrap = td.querySelector('.mcp-cc-rating-wrap');

    // 1. Feature Availability Mode (status - default):
    // If a cell has an icon, presence of check / cross / dash indicates feature inclusion/exclusion.
    // When all products have check (✔), all products have the feature -> no differentiator.
    // When all products have cross (✖), no product has the feature -> no differentiator.
    // When all products have dash (—), all products are neutral -> no differentiator.
    if (diffMode !== 'strict') {
      if (check) return 'status:check';
      if (cross) return 'status:cross';
      if (dash) return 'status:dash';
    }

    // 2. Strict Mode OR Text/Rating Cells:
    var subtextEl = td.querySelector('.mcp-cc-cell-subtext');
    var textVal = (subtextEl ? subtextEl.textContent : td.textContent).trim().toLowerCase();

    // Normalize generic words ("yes", "included", "true", empty "") so blank checks and "Yes" checks match
    var isGenericAffirmative = (textVal === '' || textVal === 'yes' || textVal === 'included' || textVal === 'true' || textVal === 'check');
    var isGenericNegative = (textVal === '' || textVal === 'no' || textVal === 'none' || textVal === 'not included' || textVal === 'false' || textVal === 'cross');
    var isGenericNeutral = (textVal === '' || textVal === '—' || textVal === '-' || textVal === 'n/a' || textVal === 'dash');

    if (check) {
      return isGenericAffirmative ? 'check' : 'check:' + textVal;
    }
    if (cross) {
      return isGenericNegative ? 'cross' : 'cross:' + textVal;
    }
    if (dash) {
      return isGenericNeutral ? 'dash' : 'dash:' + textVal;
    }
    if (ratingWrap) {
      var ratingNum = td.querySelector('.mcp-cc-rating-num');
      return 'rating:' + (ratingNum ? ratingNum.textContent.trim() : textVal);
    }
    return 'text:' + textVal;
  }
});

