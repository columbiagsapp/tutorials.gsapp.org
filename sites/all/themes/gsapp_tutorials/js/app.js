
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
          vote: function(addition){
            console.log('Question.vote() | current score: '+ this.get('field_question_votes').und[0].value );
            var newVoteTotal = this.get('field_question_votes').und[0].value + addition;
            this.set({ vote: newVoteTotal });
            this.save();
          }
        });

        var QuestionList = Drupal.Backbone.Collections.NodeView.extend({
          model: Question,
          //initialize: function(opts){
            //this.constructor.__super__.initialize.call(this, opts);
          //  Drupal.Backbone.Collections.NodeView.prototype.initialize.call(this, opts);
          //  console.log('init, length: '+ this.length);
          //}
          reorder: function(){
            //function to reorder questions based on votes
          }
        });


        // Create our global collection of **Todos**.
        var Questions = new QuestionList({viewName: 'questions_from_tutorial' });
        //set param to tutorial nid, the one argument the Drupal view takes
        Questions.setParams({ nid: tutorialNid }); 


        /*
          STEP 3
          Create a view for each Questions
          Uses the bb_question_template from the node--tutorial.tpl.php file
          to format each question
        */
        var QuestionView = Backbone.View.extend({
          tagName:  "li",
          template: _.template($('#bb_question_template').html()),
          events: {
            "click .vote-up"   : "voteUp",
            "click .vote-down"   : "voteDown"
          },

          initialize: function() {
            this.model.bind('change', this.render, this);
            console.log('QuestionView template: ');
            console.dir(this.template);
          },

          voteUp: function(){
            this.model.vote(1);
          },

          voteDown: function(){
            this.model.vote(-1);
          },

          render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            //TODO: resort based on new vote order

            //this.$el.toggleClass('done', this.model.get('log') == 'done');
            //this.input = this.$('.edit');
            return this;
          },

        });




        tutorial.fetch({
          success: function() {
            console.log('tutorial title: '+ tutorial.get('title') );

            console.log('tutorial field_questions_reference: '+ tutorial.get('field_questions_reference').und[0].nid );


            Questions.fetch({
              success: function(){
                console.log( Questions.length );
              }
            });

            


           // _.each(Questions, function(num, key){console.log('question num: '+ num + ' key: '+ key)});

          /*
            var questionsNidArray = tutorial.get('field_questions_reference').und; 
            var questionsArray = [];
            for(var i = 0; i < questionsArray.length; i++){
              questionsArray[i] = new Question({ nid: questionsNidArray[i].nid });
              //Questions.push(questionsArray[i]);
            }

            Questions.fetch({});
          */

          }
        });

        


        

        

        

        //var quest = new Question({nid : 189});

        //Questions = new QuestionList;

      }
    }
  }
})(jQuery);
