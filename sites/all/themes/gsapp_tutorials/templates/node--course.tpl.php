

<article id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix course"<?php print $attributes; ?>>

  <header class="jumbotron subhead">
    <div class="container header-left">
      <div class="clearfix"><?php print render($content['field_code']); ?> <?php print render($content['field_semester']); ?> <?php print render($content['field_year']); ?></div>
      <h1 class="clearfix"><?php print $title; ?></h1>
      <div class="clearfix"><?php print render($content['field_instructors']); ?>
      </div>
    </div><!-- /.header-left -->
    <div class="container header-right">
      <div><?php print render($content['field_links']); ?></div>
    </div><!-- /.header-right -->
  </header>

  <div class="weeks">
    <div id="weeks-list-el"></div>
  </div>


  
</article> <!-- /.node -->

<script type="text/template" id="bb_week_template">
  <li class="week brick">
    <div class="inner">
      <% if ( (typeof(title) != "undefined") && (typeof(field_week_number) != "undefined") ) { %>
        <h2>
          Week <%= field_week_number %>: <%= title %>
        </h2>
      <% } %>
      <% if (typeof(field_description) != "undefined" ) { %>
        <div class="week-description"><%= field_description %></div>
      <% } %>
      <button class="add-lesson-note">Add lesson or note</button>
      <button class="delete-week">Delete this week</button>
    </div><!-- /.inner -->
  </li>
</script>


<script type="text/template" id="collection-list">
  <div>
    <ul class="week-list-container"></ul>
  </div>
</script>


<script type="text/template" id="submit_week_template">
  <div class="week new">
    Week <textarea name="new-week-number" cols=3 rows=1>#</textarea>: <textarea name="new-week-title" cols=60 rows=1>Optional title</textarea>
    <textarea name="new-week-body" cols=80 rows=4>Optional description</textarea>
    <button class="week-submit">Create new week</button>
  </div>
</script>

