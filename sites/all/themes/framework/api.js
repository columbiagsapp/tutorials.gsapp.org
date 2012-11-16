jQuery(document).ready(function($){

  //set up a model for storing and passing new question/answer data locally
  var model = {};

  var nodeCreateURL = '/api/node';
  var nodeUpdateURL = '/api/node/update/';

  //------------------ NEW ANSWER HANDLING

  function updateQuestionPostSuccess(data) {
    // new answer is made and parent question was updated ok
   
    var answer_html = $('<div ... model.answer_body>');
    
    $("#q-" + model.question + " .answers").append(answer_html);

  }

  function updateQuestionPostError(jqXHR, errText, errThrown) {
    //the parent question could not be updated
    show_error_message();//reenter your question, it didn't save
  }

  function submitAnswerPostError(jqXHR, errText, errThrown) {
    //the new answer could not be created
    show_error_message();//reenter your question, it didn't save
  }


  function submitAnswerPostSuccess(data) {
    var new_answer_nid = data.nid;
    
    model.answer_id = new_answer_nid;

    var updated_node = {
      'nid': model.question_id,
      'type': 'question'    
    };

    var updated_node_json = JSON.stringify(updated_node);
    
    // AJAX post / update to parent question
    $.ajax({
      type: 'POST',
      url: nodeUpdateURL+model.question_id,//url for update is '/api/node/update/nid'???? TODO confirm this
      dataType: 'json',
      success: updateQuestionPostSuccess,
      contentType: "application/json;charset=utf-8",
      error: updateQuestionPostError,
      data: json_node
    });
  }




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

  function updateTutorialPostSuccess(data){
    // new answer is made and parent question was updated ok
   
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


  function submitQuestionPostSuccess(data){
    var new_question_nid = data.nid;
    
    model.question_id = new_question_nid;

    var tutorial_update = {
      'nid': model.tutorial_id,
      'type': 'question'   
    };

    var tutorial_update_json = JSON.stringify(tutorial_update);
    
    // AJAX post / update to parent question
    $.ajax({
      type: 'POST',
      url: nodeUpdateURL+model.tutorial_id,//url for update is '/api/node/update/nid'???? TODO confirm this
      dataType: 'json',
      success: updateTutorialPostSuccess,
      contentType: "application/json;charset=utf-8",
      error: updateTutorialPostError,
      data: tutorial_update_json
    });
  }


  function submitQuestion(tutorial_id, question_title, question_body, $){
    console.log('api.js | submitQuestion(' + tutorial_id + ', '+ question_title + ', ' + question_body + ')');

    //clear the model
    model = {};

    //TOOD add body 
    var new_question = {
      'title': question_title,
      'type': 'question',
      'body': question_body
    };

    //convert to json for services module POST
    var new_question_json = JSON.stringify(new_question);

    console.log('api.js | new_question_json: '+new_question_json);

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


});


