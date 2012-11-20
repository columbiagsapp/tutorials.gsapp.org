jQuery(document).ready(function ($) {
  console.log('doc ready');

/* jochen to do

  clean up code
  remove api.js
  remove js files from parent theme
  figure out dom writing upon success
*/

  //set up a model for storing and passing new question/answer data locally
  var model = {};
  var nodeCreateURL = '/api/node';  
  var nodeUpdateURL = '/api/node/';


  /**
   * gets called after new question is posted and parent tutorial reference
   * has been set
   */
  function updateQuestionPostSuccess(data) {
    //@ TODO
    var answer_html = $('<div ... model.answer_body>');
    $("#q-" + model.question + " .answers").append(answer_html);
  }

  /**
   * parent tutorial to question could not be updated
   */
  function updateQuestionPostError(jqXHR, errText, errThrown) {
    //@TODO
    show_error_message();//reenter your question, it didn't save
  }

  /**
   * answer could not be posted
   */
  function submitAnswerPostError(jqXHR, errText, errThrown) {
    //the new answer could not be created
    show_error_message();//reenter your question, it didn't save
  }

  /**
   * answer posted, now update parent question node
   */
  function submitAnswerPostSuccess(data) {
    //@TODO!
    console.log('api.js | in submitAnswerPostSuccess');
    var new_answer_nid = data.nid;
    model.answer_id = new_answer_nid;

    var updated_node = {
      'nid': model.question_id,
       'title': 'updated title ',
    };


    var updated_node_json = JSON.stringify(updated_node);
    
    $.ajax({
      type: 'POST',
      url: nodeUpdateURL+model.question_id, //url for update is '/api/node/update/nid'???? TODO confirm this
      dataType: 'json',
      success: updateQuestionPostSuccess,
      contentType: "application/json;charset=utf-8",
      error: updateQuestionPostError,
      data: json_node
    });
  }



  /**
   * entry point click handler when submitting a new answer //@TODO -> REMOVE???
   */
  function submitAnswer(question_id, answer_body) {
    console.log('api.js | submitAnswer(' + question_id + ', '+ answer_body + ')');

    //clear the model
    model = {};

    //TOOD add body 
    var new_answer = {
      'title': 'answer to question ' + question_id,
      'type': 'answer'
    };

    var new_answer_json = JSON.stringify(new_answer);

    console.log('api.js | new_answer_json: '+new_answer_json);
    
    model = {
      'question_id': question_id,
      'answer_body': answer_body
    };

    $.ajax({
      type: 'POST',
      url: nodeCreateURL,
      dataType: 'json',
      success: submitAnswerPostSuccess,
      contentType: "application/json;charset=utf-8",
      error: submitAnswerPostError,
      data: new_answer_json
    });
  }


  //------------------ NEW QUESTION HANDLING

  /** 
   * update DOM after successful question post and parent
   * tutorial update
   */
  function updateTutorialPostSuccess(data){
    //@TODO!
    var new_question_html = $('<div class="question" id="q-'+ model.question_id + '"><div class="question-title">'+model.question_title+'</div></div>');
    $("#q-" + model.tutorial_id + " .questions").append(new_question_html);
  }

  function updateTutorialPostError(jqXHR, errText, errThrown) {
    //the parent tutorial could not be updated
    show_error_message();//reenter your question, it didn't save
  }

  function submitQuestionPostError(jqXHR, errText, errThrown) {
    //the new question could not be created
    show_error_message();//reenter your question, it didn't save
  }


  /**
   * after question has been posted, retrieve the parent tutorial 
   * and set its node references
   */
  function submitQuestionPostSuccess(data){
    console.log('api.js | submitQuestionPostSuccess()');
    console.log('api.js | data.nid: '+data.nid);
    model.question_id = data.nid;

    $.ajax({
        type: "GET",
        url: '/api/node/' + model.tutorial_id,
        dataType: 'json',
        data: data,

        success: function(data) { 
          console.log('api.js | retreived data from tutorial');
          model.tutorial_node = data;
          var q_refs = data.field_questions_reference.und;
          var question_nids = {};
          question_nids["und"] = new Array();
          var i = 0;
          for (i in q_refs) {
            var qnid = q_refs[i].nid;
            question_nids["und"].push({'nid': '[nid:' + qnid + ']'});
          }
          question_nids["und"].push({'nid': '[nid:' + model.question_id + ']'});
          model.question_ref_string = question_nids;
          updateParentTutorial(model);
        }
    });
  }

  /**
   * update question parent tutorial with references
   */
  function updateParentTutorial(model) {
    var tutorial_update = {
      'nid': model.tutorial_id,
      //'title': 'new tutorial title ' + Math.random(100), //@TODO remove this just here for debugging
      'field_questions_reference' : model.question_ref_string
    }
    var tutorial_update_json = JSON.stringify(tutorial_update);

    // AJAX post / update to parent question
    $.ajax({
      type: 'PUT',
      url: nodeUpdateURL+model.tutorial_id,
      dataType: 'json',
      success: updateTutorialPostSuccess,
      contentType: "application/json;charset=utf-8",
      error: updateTutorialPostError,
      data: tutorial_update_json
    });
  }


  /** 
   * submit a new question
   */
  function submitQuestion(tutorial_id, question_title, question_body, $){
    console.log('api.js | submitQuestion(' + tutorial_id + ', '+ question_title + ', ' + question_body + ')');

    // clear model
    model = {};

    var new_question = {
      'title': question_title,
      'type': 'question',
      "language":"und",
      "field_description":{"und":{"0":{"value":question_body}}}
    };
    var new_question_json = JSON.stringify(new_question);
    console.log('api.js | new_question_json: '+ new_question_json);

    model = {
      'tutorial_id': tutorial_id,
      'question_title': question_title,
      'question_body': question_body
    };

    $.ajax({
      type: 'POST',
      url: nodeCreateURL,
      dataType: 'json',
      success: submitQuestionPostSuccess,
      contentType: "application/json;charset=utf-8",
      error: submitQuestionPostError,
      data: new_question_json
    });
  }

  


  // _________ CLICK HANDLERS ________

  $('.submit-answer').click(function(){
    var question_id = $(this).closest(".question").attr('id');
    question_id = question_id.substr(2);
    var answer_body = $(this).siblings('.answer-body').text();
    
    console.log('tutorial.js | #submit-answer clicked');
    console.log('tutorial.js | answer_body: '+answer_body);
    console.log('tutorial.js | question_node_id: '+question_id);

    submitAnswer(question_id, answer_body);
  });


  $('.submit-question').click(function(){
    var tutorial_id = $(this).closest(".tutorial").attr('id');
    var tutorial_id = tutorial_id.substr(5);
    var question_title = $(this).siblings('.question-title').val();
    var question_body = $(this).siblings('.question-body').val();

    console.log('tutorial.js | #submit-question clicked');
    console.log('tutorial.js | question_title: '+question_title);
    console.log('tutorial.js | question_body: '+question_body);
    console.log('tutorial.js | tutorial_id: '+tutorial_id);

    submitQuestion(tutorial_id, question_title, question_body, $);
  });

  

/*
  This function resizes all videos to make sure they maintain a 16:9 aspect
  ratio when resizing the browser with a responsive design
*/
$(function() {
    
    var $allVideos = $(".embedded-video iframe, .embedded-video object, .embedded-video embed"),
    $fluidEl = $(".embedded-video");
        
  $allVideos.each(function() {
    /* This was used to get the aspect ratio of the original iframe, but the video
      embed module in Drupal core requires this to be defined statically, so I've
      hard-wired it here to 16:9
    var h = $(this).height();
    var w = $(this).width();
    */
    $(this)
      // jQuery .data does not work on object/embed elements
      .attr('data-aspectRatio', 9 / 16)
      .removeAttr('height')
      .removeAttr('width');
  
  });
  
  $(window).resize(function() {
  
    var newWidth = $fluidEl.width();
    $allVideos.each(function() {
      var $el = $(this);
      $el
          .width(newWidth)
          .height(newWidth * $el.attr('data-aspectRatio'));
    });
  
  }).resize();

});


$(function () {
  $('#myTabs a:first').tab('show');
});

$(function () {
  $('.sidenav').affix({
    offset: {
      top: function () { return $window.width() <= 980 ? 290 : 210 }
    , bottom: 270
    }
  });
})


});