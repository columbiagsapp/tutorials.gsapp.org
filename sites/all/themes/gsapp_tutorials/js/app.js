
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
        console.log('tutorialNid: '+ tutorialNid);
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
            //needed to take out a bunch when using REST WS - last_view seems to be the culprit
            this.addNoSaveAttributes(['body', 'field_tutorials_reference_q', 'field_answers_reference',
             'views', 'day_views', 'last_view' ]);
          },

          vote: function(addition){
            var newVoteTotal = parseInt(this.get('field_question_votes')) + parseInt(addition);
            console.log('newVoteTotal: '+newVoteTotal);
            this.set({ 
              field_question_votes: newVoteTotal
            });
            this.save();
          }
        });


        //var question = new Question({ nid: 189 });

        /*
          STEP 3
          Create a view for each Question
          Uses the bb_question_template from the node--tutorial.tpl.php file
          to format each question
        */
        var QuestionView = Drupal.Backbone.Views.Base.extend({
          //el: "#questions-list",
          //tagName: 'li',//DOESN'T SEEM TO BE WORKING
          templateSelector: '#bb_question_template',

          events: {
            "click .voteup" :  "voteUp",
            "click .votedown" : "voteDown"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);

            this.model.bind('change', this.render, this);//this calls the fetch


            //this.model.fetch({});//just re-added this 12:04pm sunday nov 25
            
          },
          /*
          render: function(opts){
            var that = this;
            this.model.fetch({
              success: function(){
                console.log('fetched Question, now calling super render()');
                Drupal.Backbone.Views.Base.prototype.render.call(that, opts);
              }
            })
          },
  */
          voteUp: function(){
            this.model.vote('1');
          },

          voteDown: function() {
            this.model.vote('-1');
          }

        });



        var QuestionsCollection = new Drupal.Backbone.Collections.RestWS.NodeIndex({
          model: Question,

          fetchOrig: function(options){
            Backbone.Collection.prototype.fetch.call(this, options);
          }
        });

        QuestionsCollection.reset();

        console.log('***** INIT COLLECTION SIZE: '+ QuestionsCollection.length);
        console.log(QuestionsCollection.at(0));

        //can i do this?
        //QuestionsCollection.setParam("nid", "192");
        //QuestionsCollection.setParam("nid", "193");

        
       

        var QuestionsCollectionView = new Drupal.Backbone.Views.CollectionView({
          collection: QuestionsCollection,
          templateSelector: '#collection-list',
          renderer: 'underscore',
          el: '#questions-list-el',
          ItemView: QuestionView,
          itemTag: 'li',
          itemParent: '.collection-list-parent'
        });

        QuestionsCollectionView.render();


        //var q1 = new Question({ nid: 192 });
        //var q2 = new Question({ nid: 193 });

        //QuestionsCollection.add([ q1, q2 ]);
        //QuestionsCollection.fetchOrig();
        //QuestionsCollection.fetchQuery({ 
        //  field_tutorials_reference_q: ["nid": '191']
        //});

        QuestionsCollection.fetchQuery({
   "field_tutorials_reference_q":
      {
         "nid":{
            "nid":"191"
         }
      }
   
});
      
        //renders the #collection-list template content html into the el (#questions-list-el)
        //QuestionsCollectionView.render();

        /*

        var Questions_i = [];

        tutorial.fetch({
          success: function(){
            var question_refs = tutorial.get('field_questions_reference');
            //populate the Questions_i array with all the question reference nids
            for(var i = 0; i < question_refs.length; i++){
              Questions_i[i] = new Question({ nid: question_refs[i].id });
              //add the array of questions to the QuestionsCollection
              QuestionsCollection.add(Questions_i[i]);//should trigger addOne, which renders
            }


            QuestionsCollection.fetch({
              success: function(){
                QuestionsCollectionView.render();
              }
            });

            

            //QuestionsCollection.fetchQuery({type:"question", nid: question_nids[i]});
          }
        });

        */

        //grabs all the nodes in the DB with the passed parameters to filter out
        //here, that's only type = question, but need to fill this in with
        //the list of question refs from the tutorial nid
        //QuestionsCollection.fetchQuery({type:"question"});
  

      }//end if tutorial
    }//end behavior attach
  }//end behavior
})(jQuery);
