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
      <h1 class="clearfix"><a href="/course/<?php print $node->nid; ?>" target="_self"><?php print $title; ?></a></h1>
      <div class="clearfix"><?php print render($content['field_instructors']); ?>
      </div>
    </div><!-- /.header-left -->
    <div class="container header-right">
      <div><?php print render($content['field_links']); ?></div>
    </div><!-- /.header-right -->
  </header>


  <div id="main" class="row-fluid">
    <section id="schedule" class="span9"> 
      <h2 id="schedule-button" class="heading float-left heading-button editable">Schedule</h2>
      <?php if($editable){ ?>
        <div id="add-week-container" class="button">+</div>
      <?php } ?>
      <div class="weeks">
        <div id="weeks-list-el"></div>
        <div id="week-preloader" class="week brick roman preloader"></div>
      </div>
    </section> <!-- /.node -->


    <section id="updates" class="span3 collapsed outer" role="complementary">
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
  <div id="<% if (typeof(nid) != 'undefined' ) { %>node-<%= nid %><% }else{ %>node-temp<% } %>" class="lesson brick standard glowing-box open">
    <div class="inner float-left">
      <div class="text-wrapper">
        <% if ( typeof(title) != "undefined" ) { %>
          <h2 class="title">
            <div class="editable lesson-title"><%= title %></div>
          </h2>
        <% } %>
        <% if (typeof(field_description) != "undefined" ) { %>
          <div class="editable collapsible lesson-description">
            <%= field_description_summary %>
          </div>
        <% } %>
      </div><!-- /.text-wrapper -->
      <div class="icon-wrapper">
        <% if( typeof(field_embeds) != "undefined" ) { %>
            <% if(field_embeds.indexOf('Video') > -1 ){ %><i class="icon-play"></i><% } %>
            <% if(field_embeds.indexOf('Soundcloud') > -1 ){ %><i class="icon-music"></i><% } %>
            <% if(field_embeds.indexOf('Scribd') > -1){ %><i class="icon-file"></i><% } %>
            <% if(field_embeds.indexOf('Slideshare') > -1){ %><i class="icon-th"></i><% } %>
        <% } %>
      </div><!-- /.icon-wrapper -->
    </div><!-- /.inner -->
  </div>
</script>

<script type="text/template" id="bb_lesson_open_template">
  <div id="<% if (typeof(nid) != 'undefined' ) { %>open-node-<%= nid %><% }else{ %>open-node-temp<% } %>" class="lesson-open brick roman">
    <div id="lesson-open-anchor" class="inner">
      <div class="content">
        <h2 class="title"><div class="editable lesson-title editable-title"><% if ( typeof(title) != "undefined" ) { %><%= title %><% } %></div></h2><!-- /.title -->

        <div class="editable collapsible lesson-description editable-description"><% if (typeof(field_description) != "undefined" ) { %><%= field_description %><% } %></div><!-- /.lesson-description -->

        <div class="embeds-list-el"></div>
        <div class="embed brick roman preloader"></div>
        

      </div><!-- /.content -->

      <div class="content-edit">
        <div class="btn-group dropup button-group-text float-left">
          <a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
            <i class="icon-reorder"></i>&nbsp;&nbsp;Text
            <span class="caret"></span>
          </a>
          <ul class="dropdown-menu">
            <li><a tabindex="-1" href="#lesson-open-anchor" class="button-text-text"><i class="icon-reorder"></i> Text</a></li>
            <li><a tabindex="-1" href="#lesson-open-anchor" class="button-text-link"><i class="icon-link"></i> Link</a></li>
            <li><a tabindex="-1" href="#lesson-open-anchor" class="button-text-bibliography"><i class="icon-book"></i> Bibliography</a></li>
          </ul>
        </div>

        <div class="btn-group dropup button-group-embed float-left">
          <a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
            <i class="icon-globe"></i>&nbsp;&nbsp;Embed
            <span class="caret"></span>
          </a>
          <ul class="dropdown-menu">
            <li><a tabindex="-1" href="#lesson-embed-video-anchor" class="button-embed-video"><i class="icon-play"></i> Youtube/Vimeo</a></li>
            <li class="divider"></li>
            <li><a tabindex="-1" href="#" class="button-embed-slideshare"><i class="icon-th"></i> Slideshare</a></li>
            <li><a tabindex="-1" href="#" class="button-embed-scribd"><i class="icon-file"></i> Scribd</a></li>
            <li class="divider"></li>
            <li><a tabindex="-1" href="#" class="button-embed-soundcloud"><i class="icon-music"></i> Soundcloud</a></li>
          </ul>
        </div>

        <div class="btn-group dropup button-group-upload float-left">
          <a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
            <i class="icon-upload-alt"></i>&nbsp;&nbsp;Upload
            <span class="caret"></span>
          </a>
          <ul class="dropdown-menu">
            <li><a tabindex="-1" href="#" class="button-upload-pdf"><i class="icon-file"></i> PDF</a></li>
            <li><a tabindex="-1" href="#" class="button-upload-file"><i class="icon-upload-alt"></i> File</a></li>
          </ul>
        </div>
      </div><!-- /.lesson-embed-upload -->
      
      <?php if($editable){ ?>
        <div class="edit-lesson-buttons collapsible">
          <div class="edit button">Edit</div>
          <div class="cancel button">Cancel</div>
          <div class="delete button">Delete</div>
        </div>
      <?php } ?>
    </div><!-- /.inner -->


  </div>

  <div id="lesson-attachment" class="roman">
    <ul id="lesson-nav">
      <li class="inline"><h2 class="inline">Q&amp;A</h2></li>
      <li class="inline inactive"><h2 class="inline">Assignments</h2></li>
      <li class="inline inactive"><h2 class="inline">Transcript</h2></li>
    </ul>

    <div id="lesson-attachment-content">
      <div id="questions-list-el"></div>
        <div class="add-question brick roman edit-mode">
          <div class="inner">
            <h4 class="float-left">Ask a question</h4>
            <div class="submit-question-buttons float-right">
              <div id="question-submit" class="button save">Save</div>
              <div id="question-submit-cancel" class="button cancel">Cancel</div>
            </div>
            <div class="roman float-left submit-question-content-container">
              <h2><div id="submit-question-title" class="editable"></div></h2>
              <div id="submit-question-question" class="editable"></div>
            </div>
          </div><!-- /.inner -->
        </div><!-- /.add-question -->
      </div><!-- /#questions-list-el-->
    </div><!-- /#lesson-content -->
  </div><!-- /#lesson-attachment -->

</script>

<script type="text/template" id="bb_embed_template">
  <div class="collapsible lesson-embed-wrapper">
    <div id="node-<% if (typeof(nid) != "undefined" ){ %><%= nid %><% } %>" class="lesson-embed-element <% if (typeof(field_embed_type) != "undefined" ){ %><%= field_embed_type %><% } %>">
      <div class="field-embed-edit-wrapper">
        <div class="field-embed-edit-top">
          <label class="field-embed-edit-label">
            <% if (typeof(field_embed_type) != "undefined" ){ %>
              <span class="type-code"><%= field_embed_type %></span> embed code
            <% } %>
          </label>
          <div class="field-embed-edit-buttons">
            <div class="remove">Remove</div>
          </div>
        </div><!-- /.field-embed-edit-top -->
        <div class="field-embed-edit-code editable">
        </div><!-- /.field-embed-edit-code -->
      </div><!-- /.field-embed-edit-wrapper -->
      <div class="field-embed-content-wrapper">
        <% if (typeof(field_embed_code) != "undefined" ){ %>
          <%= field_embed_code %>
        <% } %>
      </div><!-- /.field-embed-content-wrapper -->
    </div><!-- /#lesson-embed-element-index -->
  </div><!-- /.lesson-embed-wrapper -->
</script>

<script type="text/template" id="bb_week_template">
  <div id="<% if (typeof(nid) != 'undefined' ) { %>node-<%= nid %><% }else{ %>node-temp<% } %>" class="week brick roman outer">
    <div class="inner">
      <div class="week-header">
        <div class="week-header-top">
          <% if ( (typeof(title) != "undefined") && (typeof(field_week_number) != "undefined") ) { %>
            <h2 class="title">
              <div class="float-left">Week <span class="editable week-field week-number"><%= field_week_number %></span>:</div><div class="editable week-field week-title"><%= title %></div>
            </h2>
          <% } %>
        </div><!-- /.week-header-top -->
        <% if (typeof(field_description) != "undefined" ) { %>
          <div class="editable collapsible week-field week-description"><%= field_description %></div>
        <% } %>
      </div><!-- /.week-header -->

      <div class="lessons-list-el"></div>
      <div class="lesson brick standard preloader"></div>
      
      <?php if($editable){ ?>
        <div class="add-lesson brick standard collapsible glowing-box">
          <div class="add-lesson-note-plus">+</div>
        </div>
      <?php } ?>

      <?php if($editable){ ?>
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

<script type="text/template" id="embed-list">
  <div>
    <div class="embed-list-container"></div>
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


<script type="text/template" id="bb_question_template">
  <div class="question brick roman">
    <div class="inner">
      <div class="votes-container center">
        <div class="voteup"><i class="icon-chevron-up"></i></div>
        <div class="vote-total">
          <% if (typeof(field_question_votes) != "undefined" ) { %>
            <%= field_question_votes %>
          <% }else{ %>
            0
          <% } %>
        </div>
        <div>Votes</div>
        <div class="votedown"><i class="icon-chevron-down"></i></div>
      </div><!-- /.votes-container -->

      <div class="question-container">
        <% if (typeof(title) != "undefined" ) { %>
          <h2><%= title %></h2>
        <% } %>
        <% if (typeof(field_description) != "undefined" ) { %>
          <div><%= field_description %></div>
        <% } %>
      </div>
      
      <div class="author-container center">
        <div>Asked</div>
        <div class="relative-date"></div>
        <div>by</div>
        <div class="author"></div>
      </div>
      
    </div><!-- /.inner -->
  </div><!-- /.question -->
  <div class="response roman">
    <div class="inner-sides">
      <h3 class="inactive flatten float-left">View Responses</h3>
    </div><!-- /.inner-sides -->
  </div><!-- /.response -->
</script>

<script type="text/template" id="submit_question_template">
  <div class="add-question">
    <h4 class="float-left">Ask a question</h4>
    <textarea name="newquestion">
      Add your question text here
    </textarea>
    <button class="questionsubmit">Ask</button>
  </div>
</script>

<script type="text/template" id="collection-list">
  <div>
    <div class="collection-list-parent"></div>
  </div>
  
</script>



