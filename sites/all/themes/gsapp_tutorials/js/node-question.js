(function ($){
  Drupal.behaviors.app = {
      attach: function() {

///////////////////////////////////////////////////////////////
////////////////// QUESTION MODEL /////////////////////////////
///////////////////////////////////////////////////////////////

var Question = Drupal.Backbone.Models.Node.extend({
  //need to init in order to bind vote to this Model as a local function
  initialize: function(opts){
    Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
    _(this).bindAll('vote');

    //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
    //needed to take out a bunch when using REST WS - last_view seems to be the culprit
    this.addNoSaveAttributes(['body', 'field_answers_reference',
     'views', 'day_views', 'last_view', 'uri', 'resource', 'id' ]);
  },

  //used when user clicks on vote (up or down) button to promote the question up or down
  vote: function(addition){
    var newVoteTotal = parseInt(this.get('field_question_votes')) + parseInt(addition);

    if(newVoteTotal >= 0){ //don't let the total go below zero
      this.set({ 
        field_question_votes: newVoteTotal
      });
      //sends a PUT request to the REST WS server with a payload that includes all the attributes
      //except for those passed in an array to addNoSaveAttributes() in initialize() above
      this.save();

      QuestionsCollectionView.resort();
    }
  }
});

///////////////////////////////////////////////////////////////
////////////////// QUESTION VIEWS /////////////////////////////
///////////////////////////////////////////////////////////////

var QuestionView = Drupal.Backbone.Views.Base.extend({
  //the Underscore formated template in node--tutorial.tpl.php stored in a 
  //<script> tag and identified by its id
  templateSelector: '#bb_question_template',

  //bind vote up and down events to the buttons and tie these to local functions
  events: {
    "click .voteup" :  "voteUp",
    "click .votedown" : "voteDown"
  },

  initialize: function(opts) {
    Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);

    //every time the related Question model changes any values, such
    //as on a vote, this binding will call the render method from the super/parent
    //class Drupal.Backbone.Views.Base which extends Backbone.View
    this.model.bind('change', this.render, this);//this calls the fetch
  },
  
  //vote up binding - just calls the related Question model's vote method
  //with the appropriate value (eg. +1)
  voteUp: function(){
    this.model.vote('1');
  },

  voteDown: function() {
    this.model.vote('-1');
  }
});

///////////////////////////////////////////////////////////////
////////////////// QUESTION COLLECTIONS ///////////////////////
///////////////////////////////////////////////////////////////

var QuestionCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
  model: Question,
  comparator: function(question) {
    return -question.get("field_question_votes");//negative value to sort from greatest to least
  }
});

///////////////////////////////////////////////////////////////
////////////////// QUESTION COLLECTION VIEWS //////////////////
///////////////////////////////////////////////////////////////

var QuestionCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend();
    }//end attach
  }//end behav
})(jQuery);
