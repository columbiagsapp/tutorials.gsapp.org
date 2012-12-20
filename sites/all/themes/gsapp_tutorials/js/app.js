
var app = app || {};
var pathArray = window.location.pathname.split('/');

(function ($){
  Drupal.behaviors.app = {
    attach: function() {

      /*
        STEP 0
        Determine the page type from the url
        tutorial or course
      */
      if(pathArray[1] === 'tutorial'){


        /* 
          STEP 1
          create the tutorial node Backbone object
          this will be used to fetch the tutorial node which can then tell us which questions
          are related (through node refs), the related assignments, etc - ie. all the things
          we want to load dynamically through Backbone so that the user can dynamically update them
        */
        var tutorialNid = pathArray[2];//nid from URL
        var tutorial = new Drupal.Backbone.Models.Node({ nid: tutorialNid });//get this from the url eventually

        
        /*
          STEP 2
          create the question node Backbone Model by extending Backbone.Model
          which has already been extended by Drupal.Backbone.Models.Node to take care
          of boilerplate (like setting the entity type to node, etc)
        */
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


        /*
          STEP 3
          Create a view for each Question
          Uses the bb_question_template from the node--tutorial.tpl.php file
          to format each question
        */
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


        /*
          STEP 4
          create a collection of questions that extends the NodeIndex collection
          that comes with the Drupal Backbone module
        */

        var QuestionCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Question,
          comparator: function(question) {
            return -question.get("field_question_votes");//negative value to sort from greatest to least
          }
        });

        var QuestionsCollection = new QuestionCollectionPrototype();

        //TODO: for some reason the collection is initializing with one model
        //that is undefined, so reset it immediately to clear it out
        QuestionsCollection.reset();

       

        /*
          STEP 5
          create the CollectionView for the QuestionsCollection which will
          run the main fetch command, which will drive the addOne functions
          which call the .render function of each QuestionView (they will add
          a QuestionView for each Question in the collection, then call its render,
          then append it to el)
        */

        var QuestionCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
          resort: function(opts){
          }
        });

        var QuestionsCollectionView = new QuestionCollectionViewPrototype({
          collection: QuestionsCollection,
          templateSelector: '#collection-list',
          renderer: 'underscore',
          el: '#questions-list-el',
          ItemView: QuestionView,
          itemTag: 'li',
          itemParent: '.collection-list-parent'
        });



        /* 
          STEP 6
          Attach the #collection-list template including <ul .collection-list-parent
          to the el (#question-list-el)
        */
        QuestionsCollectionView.render();

        /* 
          STEP 7
          Fetch the collection of Question nodes by sending the nid of the tutorial
        */
        QuestionsCollection.fetchQuery({
          "field_parent_tutorial_nid":pathArray[2]
        });


        /*
          STEP 8
          Create an empty question for new question to be asked
        */
        $('#questionsubmit').bind('click',function(){
          var q = new Question({
            "title": $('#submitquestiontitle').val(),
            "field_question_votes":"0",
            "field_description": $('#submitquestionquestion').val(),
            "type": "question"

          });

          //need to set this explicitly for a node create
          //because the Drupal Backbone module doesn't know
          //when the node is new... must be a better way!
          q.url = "/node";
          
          var resp = q.save({}, {
            success: function(model, response, options){
              //not sure why the BB drupal module can't handle this
              //need to set the model's id explicitly, otherwise it
              //triggers the isNew() function in backbone.js and it
              //tries to create a new one in the db, and because I 
              //over rode the url because it was originally new,
              //I need to re-instate the url
              //TOOD: I should fix this in the Drupal BB module
              q.id = response.id;
              q.url = "/node/" + response.id + ".json";
              q.set({
                "field_parent_tutorial_nid":pathArray[2]
              });

              q.save();

              QuestionsCollection.render();
            }
          });
          //this can be asyncronous with the server save, meaning that
          //it can update the display even before the server returns a 
          //response (it doesn't have to be in the success callback)
          QuestionsCollectionView.addOne(q);
       
        });
        
      
        

      }//end if tutorial

      if(pathArray[1] === 'course'){
       
        /* 
          STEP 1
          create the tutorial node Backbone object
          this will be used to fetch the tutorial node which can then tell us which questions
          are related (through node refs), the related assignments, etc - ie. all the things
          we want to load dynamically through Backbone so that the user can dynamically update them
        */
        var courseNid = pathArray[2];//nid from URL
        var course = new Drupal.Backbone.Models.Node({ nid: courseNid });//get this from the url eventually


        /*
          STEP 2A
          create the lesson node Backbone Model by extending Backbone.Model
          which has already been extended by Drupal.Backbone.Models.Node to take care
          of boilerplate (like setting the entity type to node, etc)
        */
        var Lesson = Drupal.Backbone.Models.Node.extend({
          initialize: function(opts){
            Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
            //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
            //needed to take out a bunch when using REST WS - last_view seems to be the culprit
            this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id']);
          }
        });
        
        var Week = Drupal.Backbone.Models.Node.extend({
          initialize: function(opts){
            Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
            //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
            //needed to take out a bunch when using REST WS - last_view seems to be the culprit
            this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id' ]);
          }
        });

        var Update = Drupal.Backbone.Models.Node.extend({
          initialize: function(opts){
            Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
            this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id' ]);
          }
        });

        /*
          STEP 3A
          Create a view for each Lesson
          Uses the bb_question_template from the node--tutorial.tpl.php file
          to format each question
        */
        var LessonView = Drupal.Backbone.Views.Base.extend({
          //the Underscore formated template in node--tutorial.tpl.php stored in a 
          //<script> tag and identified by its id
          templateSelector: '#bb_lesson_template',

          //bind vote up and down events to the buttons and tie these to local functions
          events: {
            "click .edit" : "editLesson",
            "click .delete": "deleteLesson",
            "click .cancel": "cancelEdit"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);//this calls the fetch 
          },

          editLesson: function(){
            console.log('editLesson');
            var this_selector = '#node-' + this.model.get('nid');
            if($('.edit', this_selector).text() == "Edit"){
              $('input[type="text"], textarea', this_selector).removeAttr('readonly');
              $('.edit', this_selector).text('Save');
              $('.delete, .cancel', this_selector).show();
              $(this_selector).css('backgroundColor', '#aaa').css('color','whitesmoke');
              $('.button', this_selector).css('backgroundColor', 'whitesmoke').css('color','#aaa');
              $(this_selector).closest('.week').find('.edit-week-buttons, .add-lesson-note-wrapper').hide();
            }else{
              console.log('editLesson-save');
              this.model.set({
                "title": $(this_selector + ' .lesson-title').val(),
                "field_description": $(this_selector + ' .lesson-description').val()
              });

              this.model.save();
              this.cancelEdit();
            }
          },

          deleteLesson: function(){
            this.model.destroy();
          },

          cancelEdit: function(){
            console.log('cancelEdit lesson');
            var this_selector = '#node-' + this.model.get('nid');
            $('.edit', this_selector).text('Edit');
            $('.delete, .cancel', this_selector).hide();
            $(this_selector).css('backgroundColor', '').css('color','');
            $('.button', this_selector).css('backgroundColor', '').css('color','');
            $(this_selector).closest('.week').find('.edit-week-buttons, .add-lesson-note-wrapper').show();
            $('input[type="text"], textarea', this_selector).attr('readonly','readonly');
            
            //Revert textarea values to database values (works for save and cancel b/c already saved to local memory)
            $('textarea.lesson-title', this_selector).val( this.model.get('title') );
            $('textarea.lesson-description', this_selector).val( this.model.get('field_description') );
          }

        });

        var WeekView = Drupal.Backbone.Views.Base.extend({
          //the Underscore formated template in node--tutorial.tpl.php stored in a 
          //<script> tag and identified by its id
          templateSelector: '#bb_week_template',

          //bind vote up and down events to the buttons and tie these to local functions
          events: {
            "click .add-lesson-container" :  "addLesson",
            "click .edit-week-buttons .edit" : "editWeek",
            "click .edit-week-buttons .delete": "deleteWeek",
            "click .edit-week-buttons .cancel": "cancelEdit"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            //TODO TCT2003 THURS DEC 20, 2012: this shouldn't be commented out, but 
            //I had to because adding {silent: true} as an option to the set method in 
            //the editWeek function (during a save) was triggering a change event
            //which called a fetch and then deleted all the lessons from the week
            //this.model.bind('change', this.render, this);//this calls the fetch 
          },
          
          //vote up binding - just calls the related Question model's vote method
          //with the appropriate value (eg. +1)
          addLesson: function(){
            var weekNID = this.model.get('nid');
            var l = new Lesson({
              "title": "Lesson title",
              "field_description": "Optional description",
              "type": "lesson"
            });

            //need to set this explicitly for a node create
            //because the Drupal Backbone module doesn't know
            //when the node is new... must be a better way!
            l.url = "/node";

            var resp = l.save({}, {
              success: function(model, response, options){
                //not sure why the BB drupal module can't handle this
                //need to set the model's id explicitly, otherwise it
                //triggers the isNew() function in backbone.js and it
                //tries to create a new one in the db, and because I 
                //over rode the url because it was originally new,
                //I need to re-instate the url
                //TOOD: I should fix this in the Drupal BB module
                l.id = response.id;
                l.url = "/node/" + response.id + ".json";
                l.set({
                  "field_parent_week_nid":weekNID,
                  "nid":response.id
                });
                l.save();
              }
            });
            LessonsCollectionView[weekNID].addOne(l);
            

          },

          editWeek: function(){
            var this_selector = '#node-' + this.model.get('nid');
            if($('.edit-week-buttons .edit', this_selector).text() == "Edit"){
              console.log('editWeek-edit');
              $('.edit-week-buttons .edit', this_selector).text('Save');
              $('.edit-week-buttons .delete', this_selector).show();
              $('.edit-week-buttons .cancel', this_selector).show();
              $('.add-lesson-note-wrapper', this_selector).hide();
              $(this_selector).css('backgroundColor', '#aaa').css('color','whitesmoke');
              $('.edit-week-buttons .button', this_selector).css('backgroundColor', 'whitesmoke').css('color','#aaa');
              $('.lesson .edit-lesson-buttons', this_selector).hide();
              $('input[type="text"], textarea', this_selector).removeAttr('readonly');
            }else{
              console.log('editWeek-save');
              var weekNumber = $(this_selector + ' .week-number').val();
              //add preceding 0 to single digit week, and remove trailing digits/whitespace past 2 chars
              if( weekNumber.length == 1){
                weekNumber = '0' + weekNumber;
              }else if(weekNumber.length > 2){
                weekNumber = weekNumber.substr(0,2);
              }
              
              this.model.set({
                "title": $(this_selector + ' .week-title').val(),
                "field_week_number": weekNumber,
                "field_description": $(this_selector + ' .week-description').val()
              });//TODO TCT2003 should have {silent: true}, see TODO DEC 20 in initialize

              this.model.save();
              this.cancelEdit();
            }
          },

          deleteWeek: function(){
            this.model.destroy();
          },

          cancelEdit: function(){
            var this_selector = '#node-' + this.model.get('nid');
            $('.edit-week-buttons .edit', this_selector).text('Edit');
            $('.edit-week-buttons .delete', this_selector).hide();
            $('.edit-week-buttons .cancel', this_selector).hide();
            $(this_selector).css('backgroundColor', '').css('color','');
            $('.edit-week-buttons .button', this_selector).css('backgroundColor', '').css('color','');
            $('.lesson .edit-lesson-buttons', this_selector).show();
            $('.add-lesson-note-wrapper', this_selector).show();
            $('input[type="text"], textarea', this_selector).attr('readonly','readonly');
            
            //Revert textarea values to database values (works for save and cancel b/c already saved to local memory)
            $('textarea.week-title', this_selector).val( this.model.get('title') );
            $('textarea.week-number', this_selector).val( this.model.get('field_week_number') );
            $('textarea.week-description', this_selector).val( this.model.get('field_description') );
          }

        });

        var UpdateView = Drupal.Backbone.Views.Base.extend({
          templateSelector: '#bb_update_template',
          events: {
            "click .edit" : "editUpdate",
            "click .delete": "deleteUpdate",
            "click .cancel": "cancelEdit"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);//this calls the fetch 
          },

          editUpdate: function(){
            console.log('editUpdate');
            var this_selector = '#node-' + this.model.get('nid');
            if($('.edit', this_selector).text() == "Edit"){
              $('.edit', this_selector).text('Save');
              $('.delete, .cancel', this_selector).show();
              $(this_selector).css('backgroundColor', '#aaa').css('color','whitesmoke');
              $('.button', this_selector).css('backgroundColor', 'whitesmoke').css('color','#aaa');
              $('#add-update-container').hide();
              $('input[type="text"], textarea', this_selector).removeAttr('readonly');
            }else{
              console.log('editUpdate-save');
              this.model.set({
                "title": $(this_selector + ' .update-title').val(),
                "field_description": $(this_selector + ' .update-description').val()
              });

              this.model.save();
              this.cancelEdit();
            }
          },


          deleteUpdate: function(){
            this.model.destroy();
          },

          cancelEdit: function(){
            var this_selector = '#node-' + this.model.get('nid');
            $('.edit', this_selector).text('Edit');
            $('.delete, .cancel', this_selector).hide();
            $(this_selector).css('backgroundColor', '').css('color','');
            $('.button', this_selector).css('backgroundColor', '').css('color','');
            $('#add-update-container').show();
            $('input[type="text"], textarea', this_selector).attr('readonly','readonly');
            
            //Revert textarea values to database values (works for save and cancel b/c already saved to local memory)
            $('textarea.update-title', this_selector).val( this.model.get('title') );
            $('textarea.update-description', this_selector).val( this.model.get('field_description') );
          }

        });

        /*
          STEP 4A
          create a collection of lessons that extends the NodeIndex collection
          that comes with the Drupal Backbone module
        */

        var LessonCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Lesson
        });

        var WeekCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Week,
          comparator: function(question) {
            return question.get("field_week_number");//negative value to sort from greatest to least
          }
        });

        var WeeksCollection = new WeekCollectionPrototype();

        //TODO: for some reason the collection is initializing with one model
        //that is undefined, so reset it immediately to clear it out
        WeeksCollection.reset();

        var UpdateCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Update
        });

        var UpdatesCollection = new UpdateCollectionPrototype();
        UpdatesCollection.reset();

        /*
          STEP 5A
          create the CollectionView for the LessonssCollection which will
          run the main fetch command, which will drive the addOne functions
          which call the .render function of each QuestionView (they will add
          a QuestionView for each Question in the collection, then call its render,
          then append it to el)
        */

        var LessonCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
          resort: function(opts){
          }
        });


        var WeekCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
          resort: function(opts){
            //this.el.detach();
            console.log('unrendering');
            this.collection.reset();
            console.log('post sort, about to render');
            //this.addAll();
          }
        });

        var WeeksCollectionView = new WeekCollectionViewPrototype({
          collection: WeeksCollection,
          templateSelector: '#week-list',
          renderer: 'underscore',
          el: '#weeks-list-el',
          ItemView: WeekView,
          //itemTag: 'li',
          itemParent: '.week-list-container'
        });
 

        var UpdateCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
          resort: function(opts){
          }
        });

        var UpdatesCollectionView = new UpdateCollectionViewPrototype({
          collection: UpdatesCollection,
          templateSelector: '#update-list',
          renderer: 'underscore',
          el: '#updates-list-el',
          ItemView: UpdateView,
          itemParent: '.update-list-container'
        });

        /* 
          STEP 6
          Attach the #collection-list template including <ul .collection-list-parent
          to the el (#question-list-el)
        */
        WeeksCollectionView.render();

        UpdatesCollectionView.render();

        var LessonsCollection = [];
        var LessonsCollectionView = [];
        /* 
          STEP 7
          Fetch the collection of Question nodes by sending the nid of the tutorial
        */
        WeeksCollection.fetchQuery({
          "field_parent_course_nid":pathArray[2],
          "type":"week"
          }, {
            success: function(model, response, options){
              $('.course .weeks .week').each(function(i){
                var weekID = $(this).attr('id');
                weekID = weekID.substr(5);

                LessonsCollection[weekID] = new LessonCollectionPrototype();
                LessonsCollection[weekID].reset();

                var theEL = '#node-' + weekID + ' .lessons-list-el';

                LessonsCollectionView[weekID] = new LessonCollectionViewPrototype({
                  collection: LessonsCollection[weekID],
                  templateSelector: '#lesson-list',
                  renderer: 'underscore',
                  el: theEL,
                  ItemView: LessonView,
                  //itemTag: 'li',
                  itemParent: '.lesson-list-container'
                });

                LessonsCollectionView[weekID].render();

                //TODO TCT2003 WED DEC 19, 2012 need to figure out how to get the week nid dynamically?
                LessonsCollection[weekID].fetchQuery({
                  "field_parent_week_nid":weekID,
                  "type":"lesson"
                });


              });
            }
        });

        UpdatesCollection.fetchQuery({
          "field_parent_course_nid":pathArray[2],
          "type":"update"
          }, {
            success: function(model, response, options){
              console.log("returned!!");
          }
        });

        /*
          STEP 8
          Create an empty question for new question to be asked
        */
        $('#add-week-container').bind('click',function(){
          var w = new Week({
            "title": "Optional title",
            "field_description": "Optional description",
            "field_week_number": "##",
            "type": "week"
          });

          //need to set this explicitly for a node create
          //because the Drupal Backbone module doesn't know
          //when the node is new... must be a better way!
          w.url = "/node";
          
          var resp = w.save({}, {
            success: function(model, response, options){
              //not sure why the BB drupal module can't handle this
              //need to set the model's id explicitly, otherwise it
              //triggers the isNew() function in backbone.js and it
              //tries to create a new one in the db, and because I 
              //over rode the url because it was originally new,
              //I need to re-instate the url
              //TOOD: I should fix this in the Drupal BB module
              w.id = response.id;
              w.url = "/node/" + response.id + ".json";
              w.set({
                "field_parent_course_nid":pathArray[2],
                "nid":response.id
              });

              w.save();

              //WeeksCollection.render();
            }
          });
          //this can be asyncronous with the server save, meaning that
          //it can update the display even before the server returns a 
          //response (it doesn't have to be in the success callback)
          WeeksCollectionView.addOne(w);
       
        });

        $('#add-update-container').bind('click',function(){
          var u = new Update({
            "title": "Title",
            "field_description": "Text",
            "type": "update"
          });

          //need to set this explicitly for a node create
          //because the Drupal Backbone module doesn't know
          //when the node is new... must be a better way!
          u.url = "/node";
          
          var resp = u.save({}, {
            success: function(model, response, options){
              //not sure why the BB drupal module can't handle this
              //need to set the model's id explicitly, otherwise it
              //triggers the isNew() function in backbone.js and it
              //tries to create a new one in the db, and because I 
              //over rode the url because it was originally new,
              //I need to re-instate the url
              //TOOD: I should fix this in the Drupal BB module
              u.id = response.id;
              u.url = "/node/" + response.id + ".json";
              u.set({
                "field_parent_course_nid":pathArray[2],
                "nid":response.id //need to set this here to update the #node-### id for the containing div
              });

              u.save();
            }
          });
          //this can be asyncronous with the server save, meaning that
          //it can update the display even before the server returns a 
          //response (it doesn't have to be in the success callback)
          UpdatesCollectionView.addOne(u);
       
        });

      }//end if course
    }//end behavior attach
  }//end behavior
})(jQuery);
