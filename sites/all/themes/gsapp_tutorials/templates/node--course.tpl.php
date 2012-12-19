<?php if(( in_array("administrator", $user->roles) || in_array("faculty", $user->roles) )){
  $editable = true;
  }else{
    $editable = false;
  }
?>

<div id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix course"<?php print $attributes; ?>>


  <header class="jumbotron subhead span12">
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


  <div class="row-fluid">
    <section class="span9"> 
      <div class="weeks">
        <div id="weeks-list-el"></div>
        <?php if($editable){ ?>
          <div id="add-week-container" class="brick roman"><div class="add">+</div></div>
        <?php } ?>
      </div>
    </section> <!-- /.node -->


    <section class="span3 sidebar" role="complementary">
      <div id="sidenav" class="span3 brick nav nav-list affix-top">
        <h2>Updates</h2>
      </div>
    </section>  <!-- /.span3 -->

  </div><!-- /.row-fluid -->


</div><!-- /.course -->


<script type="text/template" id="bb_lesson_template">
  <li id="<% if (typeof(nid) != 'undefined' ) { %>node-<%= nid %><% }else{ %>node-temp<% } %>" class="lesson brick standard">
      <% if ( typeof(title) != "undefined" ) { %>
        <h2>
          <textarea <?php if(!($editable)){ print 'readonly '; }?>class="editable lesson-title"><%= title %></textarea>
        </h2>
      <% } %>
      <% if (typeof(field_description) != "undefined" ) { %>
        <textarea <?php if(!($editable)){ print 'readonly '; }?>class="editable lesson-description"><%= field_description %></textarea>
      <% } %>
      
      <?php if($editable){ ?>
        <div class="edit-lesson-buttons">
          <button class="delete-lesson">Delete</button>
          <button class="edit-lesson">Save Changes</button>
        </div>
      <?php } ?>
  </li>
</script>

<script type="text/template" id="bb_week_template">
  <li id="<% if (typeof(nid) != 'undefined' ) { %>node-<%= nid %><% }else{ %>node-temp<% } %>" class="week brick roman">
    <div class="inner">
      <% if ( (typeof(title) != "undefined") && (typeof(field_week_number) != "undefined") ) { %>
        <h2>
          Week <textarea <?php if(!($editable)){ print 'readonly '; }?>class="editable week-number"><%= field_week_number %></textarea>: <textarea <?php if(!($editable)){ print 'readonly '; }?>class="editable week-title"><%= title %></textarea>
        </h2>
      <% } %>
      <% if (typeof(field_description) != "undefined" ) { %>
        <textarea <?php if(!($editable)){ print 'readonly '; }?>class="editable week-description brick standard"><%= field_description %></textarea>
      <% } %>

      <div class="lessons-list-el"></div>
      
      <?php if($editable){ ?>
        <div class="add-lesson brick standard"><div class="add">+</div></div>
        <div class="edit-week-buttons">
          <button class="delete-week">Delete this week</button>
          <button class="edit-week">Save Changes</button>
        </div>
      <?php } ?>
    </div><!-- /.inner -->
  </li>
</script>

<script type="text/template" id="lesson-list">
  <div>
    <ul class="lesson-list-container"></ul>
  </div>
</script>


<script type="text/template" id="week-list">
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

