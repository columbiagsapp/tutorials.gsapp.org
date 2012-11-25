
var app = app || {};
var pathArray = window.location.pathname.split('/');

(function ($){
  Drupal.behaviors.app = {
    attach: function() {

      if(pathArray[1] === 'tutorial'){


        /* 
          STEP 1
          create the tutorial node Backbone object
        */
        var tutorialNid = pathArray[2];//nid from URL
        var tutorial = new Drupal.Backbone.Models.Node({ nid: tutorialNid });//get this from the url eventually

        /*
          STEP 2
          Prep the collection of questions from Drupal view questions_from_tutorial
          which takes one argument, the tutorial nid, and returns the related questions
        */

        var Question = Drupal.Backbone.Models.Node.extend({
          
          //need to init in order to bind vote
          initialize: function(opts){
            Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
            _(this).bindAll('vote');
            //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
            this.addNoSaveAttributes('field_tutorials_reference_q');
          },

          vote: function(addition){
            var newVoteTotal = parseInt(this.get('field_question_votes').und[0].value) + parseInt(addition);
            this.set({ 
              field_question_votes: {und: [{ value: newVoteTotal }] }
            });
            this.save();
          }
        });

        var question = new Question({ nid: 189 });

        /*
          STEP 3
          Create a view for each Question
          Uses the bb_question_template from the node--tutorial.tpl.php file
          to format each question
        */
        var QuestionView = Drupal.Backbone.Views.Base.extend({
          el: "#questions-list",
          //tagName: 'li',//DOESN'T SEEM TO BE WORKING
          templateSelector: '#bb_question_template',

          events: {
            "click .voteup" :  "voteUp",
            "click .votedown" : "voteDown"
          },

          initialize: function(opts) {

            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);
            var m = this.model;
            this.model.fetch({});
            
          },

          voteUp: function(){
            this.model.vote('1');
          },

          voteDown: function() {
            this.model.vote('-1');
          }

        });

        var view = new QuestionView({ model: question });


        

        //console.log('question desc: '+ question.get('field_description').und[0].safe_value );

      }//end if tutorial
    }//end behavior attach
  }//end behavior
})(jQuery);
