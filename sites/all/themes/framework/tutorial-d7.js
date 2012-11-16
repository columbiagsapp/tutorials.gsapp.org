jQuery(document).ready(function ($) {

  

  console.log('doc ready');
  
  // gets called on error
  var postError = function(jqXHR, errText, errThrown) {
    // write an error and handle it
    console.log('error');
    console.log(errText);
    console.log(errThrown);

  }
  
  var tutorialQuestionReferencedCallback = function(response, textStatus, jqXHR) {
    console.log('returned from tutorial callback');
    console.dir(response);
  }

  // see what comes back
  var questionAddedCallback = function(data) {
    // log a message to the console
    console.log('done');
    console.log("response:"+data.nid);

    var tutorial_array = {
      'nid': data.nid,
      'type': 'tutorial',
      'field_questions_reference': data.nid
    };
    var json_tutorial = JSON.stringify(tutorial_array);
   
    var postURL = '/api/node/' + data.nid + '.json';

    $.ajax({
      type: 'POST',
      url: postURL, // the path / hook to hit
      dataType: 'json',
      success: tutorialQuestionReferencedCallback,
      contentType: "application/json;charset=utf-8",
      error: postError,
      data: json_tutorial
    });

  }

  

  


$('#add-question').click(function() {


      // make new node
      var node_array = {
        'title': 'new title',
        'type': 'question',
        'field_description': 'some question'
      };

      // json encode it
      var json_node = JSON.stringify(node_array);
      console.log('json node made');
      console.dir(json_node);



      // write it to question_save
      $.ajax({
        type: 'POST',
        url: '/api/node', // the path / hook to hit
        dataType: 'json',
        success: questionAddedCallback,
        contentType: "application/json;charset=utf-8",
        error: postError,
        data: json_node
      });
      
      console.log('posted');




      
  });




  //var xNode = Drupal.Backbone.Models.Node({nid: 55});


  //console.log(xNode);







});