jQuery(document).ready(function ($) {

  

  console.log('doc ready');
  
  

  
$('#submit-answer').click(
  var question_id = $(this).closest(".question").attr('id');
  var answer_body = $(this).siblings('.answer-body').text();
  var question_node_id = question_id.substr(2);

  console.log('tutorial.js | #submit-answer clicked');
  console.log('tutorial.js | answer_body: '+answer_body);
  console.log('tutorial.js | question_node_id: '+question_node_id);

  submit_answer(question_node_id, answer_body);
);

  


$('#add-question').click(function() {

    console.log('clicked');
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
        error: postRequestError,
        data: json_node
      });
      
      console.log('posted');


      return false;

      
  });




  //var xNode = Drupal.Backbone.Models.Node({nid: 55});


  //console.log(xNode);







});