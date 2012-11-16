jQuery(document).ready(function ($) {

  

  console.log('doc ready');
  

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
        /*
        endpoint testing
        defined in services as 'question_save'

        url             result
        question_save   http://tutorials-test7.postfog.org/node/question_save = 404

        */

        url: '/api/node', // the path / hook to hit
        dataType: 'json',
        success: updateData,
        contentType: "application/json;charset=utf-8",
        error: postError,
        data: json_node,
        success: function(response, textStatus, jqXHR){
            // log a message to the console
            console.log("response:"+response.nid);
           

        },
        error: function(jqXHR, textStatus, errorThrown){
            // log the error to the console
            console.log(
                "The following error occured: "+
                textStatus, errorThrown
            );
        }
      });
      
      console.log('posted');




      // see what comes back
       var updateData = function(data) {
        // log successloghtml = loghtml + '<br/>Success!';
        // log something or give confirm message
        console.log('success');
        console.log(data);
      }

      // gets called on error
      var postError = function(jqXHR, errText, errThrown) {
        // write an error and handle it
        console.log('error');
        console.log(errText);
        console.log(errThrown);

      }

  });




  //var xNode = Drupal.Backbone.Models.Node({nid: 55});


  //console.log(xNode);







});