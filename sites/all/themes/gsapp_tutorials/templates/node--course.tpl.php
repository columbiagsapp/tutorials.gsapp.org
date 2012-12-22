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


  <div id="main" class="row-fluid">
    <section id="schedule" class="span9"> 
      <h2 id="schedule-button" class="heading float-left heading-button">Schedule</h2>
      <div class="weeks">
        <div id="weeks-list-el"></div>
        <div id="week-preloader" class="week brick roman preloader"></div>
        <?php if($editable){ ?>
          <div id="add-week-container" class="button">+ Week</div>
        <?php } ?>
      </div>
    </section> <!-- /.node -->


    <section id="updates" class="span3 outer" role="complementary">
      <h2 id="updates-button" class="heading float-left heading-button">Updates</h2>
        <?php if($editable){ ?>
          <div id="add-update-container" class="button">+</div>
        <?php } ?>
        <div id="updates-list-el" class="el"></div>
        <div id="update-preloader" class="update brick standard preloader"></div>
    </section>  <!-- /.span3 -->

  </div><!-- /.row-fluid -->


</div><!-- /.course -->


<script type="text/template" id="bb_lesson_template">
  <div id="<% if (typeof(nid) != 'undefined' ) { %>node-<%= nid %><% }else{ %>node-temp<% } %>" class="lesson brick standard glowing-box">
    <div class="inner">
      <% if ( typeof(title) != "undefined" ) { %>
        <h2 class="title">
          <textarea readonly class="editable lesson-title"><%= title %></textarea>
        </h2>
      <% } %>
      <% if (typeof(field_description) != "undefined" ) { %>
        <textarea readonly class="editable collapsible lesson-description"><%= field_description %></textarea>
      <% } %>
      <% if (typeof(field_youtube_embed) != "undefined" ) {
            if(field_youtube_embed != null) { %>
        <div class="editable collapsible lesson-youtube-icon"></div>
      <% } }%>
      
    </div><!-- /.inner -->
  </div>
</script>

<script type="text/template" id="bb_lesson_open_template">
  <div id="<% if (typeof(nid) != 'undefined' ) { %>node-<%= nid %><% }else{ %>node-temp<% } %>" class="lesson-open brick roman">
    <div class="inner">
      <% if ( typeof(title) != "undefined" ) { %>
        <h2 class="title">
          <textarea readonly class="editable lesson-title"><%= title %></textarea>
        </h2>
      <% } %>
      <% if (typeof(field_description) != "undefined" ) { %>
        <textarea readonly class="editable collapsible lesson-description"><%= field_description %></textarea>
      <% } %>
      <% if (typeof(field_youtube_embed) != "undefined" ) { %>
        <div class="editable collapsible lesson-youtube"><%= field_youtube_embed %></div>
      <% } %>
      
      <?php if($editable){ ?>
        <div class="edit-lesson-buttons collapsible">
          <div class="edit button">Edit</div>
          <div class="cancel button">Cancel</div>
          <div class="delete button">Delete</div>
        </div>
      <?php } ?>
    </div><!-- /.inner -->
  </div>
</script>

<script type="text/template" id="bb_week_template">
  <div id="<% if (typeof(nid) != 'undefined' ) { %>node-<%= nid %><% }else{ %>node-temp<% } %>" class="week brick roman outer">
    <div class="inner">
      <% if ( (typeof(title) != "undefined") && (typeof(field_week_number) != "undefined") ) { %>
        <h2 class="title">
          Week <textarea readonly class="editable week-field week-number"><%= field_week_number %></textarea>: <textarea readonly class="editable week-field week-title"><%= title %></textarea>
        </h2>
      <% } %>
      <% if (typeof(field_description) != "undefined" ) { %>
        <textarea readonly class="editable week-field week-description"><%= field_description %></textarea>
      <% } %>

      <div class="lessons-list-el"></div>
      <div class="lesson brick standard preloader"></div>
      
      <?php if($editable){ ?>
        <div class="add-lesson-note-wrapper brick standard collapsible">
          <div class="add-lesson-note-plus">+</div>
          <div class="add-lesson-note-container">
            <div class="add-lesson-container button">Lesson</div>
            <div class="add-note-container button">Note</div>
          </div>
        </div>
        <div class="edit-week-buttons collapsible">
          <div class="edit button">Edit</div>
          <div class="cancel button">Cancel</div>
          <div class="delete button">Delete</div>
        </div>
      <?php } ?>
    </div><!-- /.inner -->
  </div>
</script>

<script type="text/template" id="bb_update_template">
  <div id="<% if (typeof(nid) != 'undefined' ) { %>node-<%= nid %><% }else{ %>node-temp<% } %>" class="update brick roman">
    <div class="inner">
      <% if ( typeof(title) != "undefined" ) { %>
        <h2 class="title">
          <textarea readonly class="editable update-title"><%= title %></textarea>
        </h2>
      <% } %>
      <% if (typeof(field_description) != "undefined" ) { %>
        <textarea readonly class="editable update-description"><%= field_description %></textarea>
      <% } %>
      
      <?php if($editable){ ?>
        <div class="edit-update-buttons">
          <div class="edit button">Edit</div>
          <div class="cancel button">Cancel</div>
          <div class="delete button">Delete</div>
        </div>
      <?php } ?>
    </div><!-- /.inner -->
  </div>
</script>

<script type="text/template" id="lesson-list">
  <div>
    <div class="lesson-list-container"></div>
  </div>
</script>


<script type="text/template" id="week-list">
  <div>
    <div class="week-list-container">
    </div>
  </div>
</script>

<script type="text/template" id="update-list">
  <div>
    <div class="update-list-container"></div>
  </div>
</script>



