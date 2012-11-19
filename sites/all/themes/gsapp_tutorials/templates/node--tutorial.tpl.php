<?php //dsm($node); ?>

<article id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix tutorial"<?php print $attributes; ?>>


  <header>
    <?php print render($title_prefix); ?>
    <?php if (!$page && $title): ?>
      <h2<?php print $title_attributes; ?>><a href="<?php print $node_url; ?>"><?php print $title; ?></a></h2>
    <?php endif; ?>
    <?php print render($title_suffix); ?>

    <?php if ($display_submitted): ?>
      <span class="submitted">
        <?php print $user_picture; ?>
        <?php print $submitted; ?>
      </span>
    <?php endif; ?>
  </header>

  <?php
    // Hide comments, tags, and links now so that we can render them later.
    //hide($content['comments']);
    //hide($content['links']);
    //hide($content['field_tags']);


    //print render($content);

    print render( field_view_field('node', $node, 'field_video_source') );
    dsm($node);




  ?>

  <div class="well">
    <ul class="nav nav-tabs" id="myTabs">
      <li class="active"><a href="#questions" data-toggle="tab">Q&amp;A</a></li>
      <li><a href="#assignments" data-toggle="tab">Assignments</a></li>
      <li><a href="#transcript" data-toggle="tab">Transcript</a></li>
    </ul>

    <div class="tab-content">
      <div class="tab-pane active" id="questions">

        <div>
          Hit this to save a test question <a href="#" id="add-question">add a new node</a>

          <div class="questions">
            <div class="ask-a-question">
              <input type="text" class="question-title" value="title"/>
              <textarea class="question-body">Ask your question</textarea>
              <button class="btn btn-primary form-submit submit-question" name="op" value="Submit" type="submit">Submit</button>
            </div>
          </div><!-- end questions -->
        </div>
        
        <div class="questions">
        <?php
          $qa_data = unserialize($content['field_qa_data']['und'][0]['value']);

          foreach($qa_data as $key=>$_) {
            print '<div class="question" id="'        . $_['dom_id'] . '">' .
                    '<div class="question-title">'    . $_['title'] . '</div>' .
                    '<div class="question-body">'     . $_['body'] . '</div>' .
                    '<div class="question-username">' . $_['username'] . '</div>' . 
                    '<!-- todo: use uid property on question to build path to name -->' .
                    '<div class="question-created">'   . $_['created'] . '</div>';// .
                    //'<div class="answers">';
            //
            //
            foreach($_['answers'] as $k=>$__) {
              print '<div class="answer" id="'        . $__['dom_nid'] . '">' .
                      '<div class="answer-body">'     . $__['body'] . '</div>' .
                      '<div class="answer-username">' . $__['username'] . '</div>' .
                      '<div class="answer-created">'  . $__['created'] . '</div>' .
                    '</div><!-- end answer -->';
            }
            print '</div>';//end .question
          }
        ?>
        </div><!-- /.questions -->
      </div>
      <div class="tab-pane" id="assignments">assignments</div>
      <div class="tab-pane" id="transcript">transcript</div>
    </div>

    <script>
      $(function () {
        $('#myTabs a:last').tab('show');
      })
    </script>
  </div><!-- /.well -->

    

  <?php if (!empty($content['field_tags']) || !empty($content['links'])): ?>
    <footer>
      <?php print render($content['field_tags']); ?>
      <?php print render($content['links']); ?>
    </footer>
  <?php endif; ?>

  <?php print render($content['comments']); ?>

</article> <!-- /.node -->
