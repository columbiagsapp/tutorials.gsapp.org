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



    print render($content);
    dsm($node);

    print 'hit this to save a test question <a href="#" id="add-question">add a new node</a>';

    //
    print '<div class="questions">';



    print '<div class="ask-a-question">' .
            '<input type="text" class="question-title" value="add a title"/>' .
            '<textarea class="question-body">ask your question</textarea>' .
            '<a href="#" class="submit-question">ask away</a>' .
          '</div>';

    print '</div><!-- end questions -->';


    print '<div class="questions">';

    $qa_data = unserialize($content['field_qa_data']['und'][0]['value']);

    foreach($qa_data as $key=>$_) {
      print '<div class="question" id="'        . $_['dom_id'] . '">' .
              '<div class="question-title">'    . $_['title'] . '</div>' .
              '<div class="question-body">'     . $_['body'] . '</div>' .
              '<div class="question-username">' . $_['username'] . '</div>' . 
              '<!-- todo: use uid property on question to build path to name -->' .
              '<div class="question-created">'   . $_['created'] . '</div>' .
              '<div class="answers">';
      //
      //
      foreach($_['answers'] as $k=>$__) {
        print '<div class="answer" id="'        . $__['dom_nid'] . '">' .
                '<div class="answer-body">'     . $__['body'] . '</div>' .
                '<div class="answer-username">' . $__['username'] . '</div>' .
                '<div class="answer-created">'  . $__['created'] . '</div>' .
              '</div><!-- end answer -->';
      }
      print '</div>';
    }
    
  ?>

  <?php if (!empty($content['field_tags']) || !empty($content['links'])): ?>
    <footer>
      <?php print render($content['field_tags']); ?>
      <?php print render($content['links']); ?>
    </footer>
  <?php endif; ?>

  <?php print render($content['comments']); ?>

</article> <!-- /.node -->
