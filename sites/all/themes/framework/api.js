// gets called on error
var postRequestError = function(jqXHR, errText, errThrown) {
  // write an error and handle it
  console.log('error');
  console.log(errText);
  console.log(errThrown);

}

var tutorialQuestionReferenceAddedCallback = function(response, textStatus, jqXHR) {
  console.log('returned from tutorial callback');
  console.dir(response);
}

// see what comes back
var questionAddedCallback = function(data) {
  // log a message to the console
  console.log('done');
  console.log("response:"+data.nid);

  var tutorial_nid = $('.node-tutorial').attr('id');
  tutorial_nid = tutorial_nid.substr(5);
  console.log('tutorial_nid: '+tutorial_nid);

  
  var tutorial_array = {
    'title': 'testing'+data.nid,
    'type':'tutorial'
    
  };

  /*
  "field_questions_reference":[
          {
             "nid":{
                "nid":"[nid:"+data.nid+"]"
             }
          }
       ]
       */

  
  var json_tutorial = JSON.stringify(tutorial_array);
 
  var postURL = '/api/node/'+tutorial_nid;

  $.ajax({
    type: 'POST',
    url: postURL, // the path / hook to hit
    dataType: 'json',
    success: tutorialQuestionReferenceAddedCallback,
    contentType: "application/json;charset=utf-8",
    error: postRequestError,
    data: json_tutorial
  });



}