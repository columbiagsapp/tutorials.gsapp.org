<?php

/**
 * @file
 * Default simple view template to display a list of rows.
 *
 * @ingroup views_templates
 */
?>
<?php if (!empty($title)): ?>
  <h3><?php print $title; ?></h3>
<?php endif; ?>
<?php foreach ($rows as $id => $row): ?>
  <div <?php if ($classes_array[$id]) { print 'class="brick roman course-index ' . $classes_array[$id] .'"';  } ?>>
  	<div class="inner row-fluid">
	    <?php print $row; ?>
	</div><!-- /.inner -->
  </div>
<?php endforeach; ?>
