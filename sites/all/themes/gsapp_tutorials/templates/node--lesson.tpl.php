<?php dsm($node); ?>

<article id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix lesson"<?php print $attributes; ?>>


  <div class="mortar-bottom">
    <?php print render( field_view_field('node', $node, 'field_video_source') );?>
  </div>

  <div class="mortar-bottom">
    <?php print render( field_view_field('node', $node, 'field_youtube_embed') );?>
  </div>

  <div class="brick">
    <ul class="nav nav-tabs" id="myTabs">
      <li class="active"><a href="#questions" data-toggle="tab">Q&amp;A</a></li>
      <li><a href="#assignments" data-toggle="tab">Assignments</a></li>
      <li><a href="#transcript" data-toggle="tab">Transcript</a></li>
    </ul>

    <div class="tab-content">
      <div class="tab-pane active" id="questions">

        <div id="questions-list-el"></div>
        <div class="add-question">
          <h4>Ask a question</h4>
          Title:
          <textarea id="submitquestiontitle" cols=40 rows=1></textarea>
          Question:
          <textarea id="submitquestionquestion" name="submitquestionquestion" cols=40 rows=4>
            Add your question text here
          </textarea>
          <button id="questionsubmit">Ask</button>
        </div>


      <!--
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

        </div>
      -->
        <!-- /#backbone-test -->




    <!-- 
          Hit this to save a test question <a href="#" id="add-question">add a new node</a>
          <div class="questions">            
            <div class="ask-a-question">
              <input type="text" class="question-title" value="title"/>
              <textarea class="question-body">Ask your question</textarea>
              <button class="btn btn-primary form-submit submit-question" name="op" value="Submit" type="submit">Submit</button>
            </div>
          
          </div>
        </div>
        
        <div class="questions">
    -->
        <?php
        /*
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
          */
        ?>
    <!--
        </div>
    --> <!-- /.questions -->
      </div><!-- /.tab-pane #questions-->


  <!--
      <div id="todoapp">
  
        <header>
          <h1>Todos</h1>
          <input id="new-todo" type="text" placeholder="What needs to be done?">
          <button id="new-todo-submit">Submit</button>
        </header>

        <section id="todoapp-main">
          <input id="toggle-all" type="checkbox">
          <label for="toggle-all">Mark all as complete</label>
          <ul id="todo-list"></ul>
        </section>

        <footer>
          <a id="clear-completed">Clear completed</a>
          <div id="todo-count"></div>
        </footer>

      </div>

      <div id="instructions">
        Double-click to edit a todo.
      </div>

      <div id="credits">
        Created by
        <br />
        <a href="http://jgn.me/">J&eacute;r&ocirc;me Gravel-Niquet</a>.
        <br />Rewritten by: <a href="http://addyosmani.github.com/todomvc">TodoMVC</a>.
        <br />Adapted for Drupal + Backone by: <a href="http://drupal.org/user/77805">Setvik</a>.
      </div>
      
  -->


      <script type="text/template" id="bb_question_template">
        <li class="question">
          <% if (typeof(title) != "undefined" ) { %>
            <h2><%= title %></h2>
          <% } %>
          <% if (typeof(field_description) != "undefined" ) { %>
            <div><%= field_description %></div>
          <% } %>
          <% if (typeof(field_question_votes) != "undefined" ) { %>
            <div><%= field_question_votes %></div>
          <% } %>
            <button class="voteup">&#43;</button>
            <button class="votedown">&#45;</button>
          </li>
      </script>

      <script type="text/template" id="submit_question_template">
        <div class="add-question">
          <h4>Ask a question</h4>
          <textarea name="newquestion" cols=40 rows=4>
            Add your question text here
          </textarea>
          <button class="questionsubmit">Ask</button>
        </div>
      </script>

      <script type="text/template" id="collection-list">
        <div>
          <ul class="collection-list-parent"></ul>
        </div>
        
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

