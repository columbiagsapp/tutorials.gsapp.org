<article id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix tutorial"<?php print $attributes; ?>>


  <div class="mortar-bottom">
    <?php print render( field_view_field('node', $node, 'field_video_source') );?>
  </div>
  <div class="brick">
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
            print '<div class="question well clearfix" id="'   . $_['dom_id'] . '">' .
                    '<div class="span1 pull-left">' .
                      '<div class="question-vote-count"><label class="question-vote-label">Votes</label>' . '5' . '</div>' .
                      '<div class="question-answer-count"><label class="question-answer-label">Votes</label>' . '10' . '</div>' .
                      '<div class="question-view-count"><label class="question-view-label">Votes</label>' . '200' . '</div>' .
                    '</div>' .
                    '<div class="span6 pull-left">' .
                      '<div class="question-title">'    . $_['title'] . '</div>' .
                      '<div class="question-body">'     . $_['body'] . '</div>' .
                    '</div>' .
                    '<div class="span2 pull-left">' .
                      '<div class="question-posted-relative">Asked ' . $_['created'] . 'by' . '</div>' .
                      '<div class="question-user-portrait">' . 'User Portrait Here' . '</div>' .
                      '<div class="question-username">' . $_['username'] . '</div>' . 
                    '</div>';
                      
            foreach($_['answers'] as $k=>$__) {
              print '<div class="answer clearfix" id="'        . $__['dom_nid'] . '">' .
                      '<div class="answer-body">'     . $__['body'] . '</div>' .
                      '<div class="answer-username">' . $__['username'] . '</div>' .
                      '<div class="answer-created">'  . $__['created'] . '</div>' .
                    '</div><!-- end answer -->';
            }
            print '</div>';//end .question
          }
          
        ?>
        </div><!-- /.questions -->
      </div><!-- /.tab-pane #questions-->

      <div id="bb_app_template">
        <form action="#" name="question-add-form" onSubmit="return false;">
          <div>
            <label for="nid">Node ID</label>
            <input type="textfield" name="nid" id="nid" />
            <input type="submit" value="load" />
          </div>
          <div id="new-question-container">
          </div>
        </form>

      </div><!-- /#backbone-test -->

      <div id="question-container-el"></div>


      <script type="text/template" id="bb_question_template">
        <% if (typeof(title) != "undefined" ) { %>
          <h2><%= title %></h2>
        <% } %>
        <% if (typeof(field_description) != "undefined" ) { %>
          <div><%= field_description.und[0].safe_value %></div>
        <% } %>
      </script>

      
      
      <div class="tab-pane" id="assignments">assignments</div>
      <div class="tab-pane" id="transcript">transcript</div>
    </div>
  </div><!-- /.well -->

    

  <?php if (!empty($content['field_tags']) || !empty($content['links'])): ?>
    <footer>
      <?php print render($content['field_tags']); ?>
      <?php print render($content['links']); ?>
    </footer>
  <?php endif; ?>


</article> <!-- /.node -->

