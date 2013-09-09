(function ($){
	Drupal.behaviors.app = {
    	attach: function() {

///////////////////////////////////////////////////////////////
////////////////// WEEK MODEL /////////////////////////////////
///////////////////////////////////////////////////////////////

var Week = Drupal.Backbone.Models.Node.extend({
  initialize: function(opts){
    Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
    //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
    //needed to take out a bunch when using REST WS - last_view seems to be the culprit
    this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id' ]);
  }
});


///////////////////////////////////////////////////////////////
////////////////// WEEK VIEWS /////////////////////////////////
///////////////////////////////////////////////////////////////

var WeekView = Drupal.Backbone.Views.Base.extend({
  //the Underscore formated template in node--tutorial.tpl.php stored in a 
  //<script> tag and identified by its id
  templateSelector: '#bb_week_template',

  //bind vote up and down events to the buttons and tie these to local functions
  events: {
    "click .add-lesson" :  "addLesson",
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
    var weekID = this.model.get('nid');

    console.log('addLesson() called by week : '+ weekID);

    //TODO TCT2003 do I need to default these fields to empty strings?
    var l = new Lesson({
      "title": "",
      "field_description": "",
      "field_description_summary": "",
      "field_embeds": "",
      "type": "lesson"
    });

    //need to set this explicitly for a node create
    //because the Drupal Backbone module doesn't know
    //when the node is new... must be a better way!
    //Perhaps the way to do it is to check isNew, then
    //set the url based on that. I think BB has this method.
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
          "field_parent_week_nid":weekID,
          "nid":response.id
        });
        l.save();

        if(LessonsCollectionView[weekID] == undefined){
          LessonsCollection[weekID] = new LessonCollectionPrototype();
          LessonsCollection[weekID].reset();

          var theEL = '#node-' + weekID + ' .lessons-list-el';

          LessonsCollectionView[weekID] = new LessonCollectionViewPrototype({
            collection: LessonsCollection[weekID],
            templateSelector: '#lesson-list',
            renderer: 'underscore',
            el: theEL,
            ItemView: LessonView,
            itemParent: '.lesson-list-container'
          });

          LessonsCollectionView[weekID].render();
        }

        var newLessonView = LessonsCollectionView[weekID].addOne(l);

        newLessonView.firstEditLesson();
      }
    });

  },

  resortWeekLessons: function(this_selector){
    console.log('resortWeekLessons');
    var weekNID = this.model.get('nid');
    var this_selector = '#node-' + weekNID;

    $('.lesson-list-container', this_selector).sortable('enable');
    $('.lesson-list-container, .lesson-list-container li', this_selector).disableSelection();
    
  },

  setWeekLessonsOrder: function(this_selector, save){
    if(save){
      //save out new order
      $('.week-list-container > li').each(function(i){
   
        var thisNID = $(this).find('.week').attr('id');
        thisNID = thisNID.substr(5);
        var WCV_iVLength = WeeksCollectionView._itemViews.length;

        for(var j = 0; j < WCV_iVLength; j++){
          var weekView = WeeksCollectionView._itemViews[j];

          if(weekView.model.get('nid') == thisNID){
            var iStr = '' + i;
            weekView.model.set({
              "field_order": iStr
            });
            weekView.model.save();
            break;
          }
        }
      });

    }else{//cancel clicked
      $('.lesson-list-container', this_selector).sortable('cancel');
    }
    $('.lesson-list-container', this_selector).sortable('disable');
    $('.lesson-list-container, .lesson-list-container li', this_selector).enableSelection();
  },

  firstEditWeek: function(){
    var this_selector = '#node-' + this.model.get('nid');
    $('.lesson.preloader', this_selector).hide();

    $(this_selector).closest('li').prependTo( $(this_selector).closest('li').parent() );

    $(this_selector).removeClass('hidden');

    setState(FIRST_EDIT_WEEK);
    //$('#main').addClass('first-edit');
    this.editWeek();
  },

  editWeek: function(){
    console.log('editWeek()');
    var this_selector = '#node-' + this.model.get('nid');

    if($('.edit-week-buttons .edit', this_selector).text() == "Edit"){
      $('.edit', this_selector).text('Save');
      $(this_selector).addClass('edit-mode');

      //launch Hallo.js
      $('.week .week-number').hallo({
        plugins: {
          'halloreundo': {}
        },
        editable: true,
        toolbar: 'halloToolbarFixed',
        placeholder: "Section title"
      });

      $('.week .week-title').hallo({
        plugins: {
          'halloreundo': {}
        },
        editable: true,
        toolbar: 'halloToolbarFixed'
      });

      $('.week .week-description').hallo({
        plugins: {
          'halloformat': {},
          'halloimage': {},
          'hallolists': {},
          'hallolink': {},
          'halloreundo': {}
        },
        editable: true,
        toolbar: 'halloToolbarFixed',
        placeholder: lessonEditHallo.placeholder.field_description
      });

      this.resortWeekLessons(this_selector);


    }else{
      clearState(FIRST_EDIT_WEEK);
      //$('#main').removeClass('first-edit');
      /* Strips week number to 2 digits and adds preceding 0 if only 1 digit
      var weekNumber = $('.week-number', this_selector).text();
      //add preceding 0 to single digit week, and remove trailing digits/whitespace past 2 chars
      if( weekNumber.length == 1){
        weekNumber = '0' + weekNumber;
      }else if(weekNumber.length > 2){
        weekNumber = weekNumber.substr(0,2);
      }
      */
      
      this.model.set({
        "title": $(this_selector + ' .week-title').text(),
        "field_week_number": $('.week-number', this_selector).text(),
        "field_description": $(this_selector + ' .week-description').html()
      });//TODO TCT2003 should have {silent: true}, see TODO DEC 20 in initialize

      this.model.save();
      this.setWeekLessonsOrder(this_selector, true);
      this.cancelEdit();
    }
  },

  deleteWeek: function(){
    WeeksCollectionView.remove(this.model);
    this.model.destroy();
    this.remove();
  },

  cancelEdit: function(){
    var this_selector = '#node-' + this.model.get('nid');
    //disable hallo.js editors
    $('.week .week-number').hallo({
      editable: false
    });

    $('.week .week-title').hallo({
      editable: false
    });

    $('.week .week-description').hallo({
      editable: false
    });

    if( getState(FIRST_EDIT_WEEK) ){
      this.model.save();
      this.deleteWeek();
    }else{
      $('.edit', this_selector).text('Edit');
      $(this_selector).removeClass('edit-mode');
      $('.add-lesson', this_selector).removeClass('hidden');
      
      //Revert textarea values to database values (works for save and cancel b/c already saved to local memory)
      $('.week-title', this_selector).text( this.model.get('title') );
      $('.week-number', this_selector).text( this.model.get('field_week_number') );
      $('.week-description', this_selector).html( this.model.get('field_description') );
      this.setWeekLessonsOrder(this_selector, false);
    }
  }

});//end WeekView


///////////////////////////////////////////////////////////////
////////////////// WEEK COLLECTIONS ///////////////////////////
///////////////////////////////////////////////////////////////

var WeekCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
  model: Week,
  comparator: function(question) {
    return question.get("field_order");//add negative value to sort from greatest to least
  }
});

///////////////////////////////////////////////////////////////
////////////////// WEEK COLLECTION VIEWS //////////////////////
///////////////////////////////////////////////////////////////

var WeekCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
  resort: function(opts){
    this.collection.reset();
  }
});



///////////////////////////////////////////////////////////////
////////////////// WEEK FUNCTIONS /////////////////////////////
///////////////////////////////////////////////////////////////
function clickAddWeek(){
	min_order = 10000;
          _.each(WeeksCollectionView._itemViews, function(view, index, list){

            var order = view.model.get('field_order');
            order = parseInt(order);
            console.log('index: '+ index + ' order: '+ order);

            if( order < min_order ){
              min_order = order;
            }
          });

          min_order = parseInt( min_order ) - 1;
          min_order = '' + min_order;

          console.log('min_order: '+ min_order);


          var w = new Week({
            "title": "",
            "field_description": "",
            "field_week_number": "Section Title",
            "field_order": min_order,
            "type": "week"
          });

          //need to set this explicitly for a node create
          //because the Drupal Backbone module doesn't know
          //when the node is new... must be a better way!
          w.url = "/node";
          
          //$('.week-list-container').append('<div id="week-preloader" class="week preloader edit-mode"></div>');
          $('#week-preloader').show();
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
              
              $('#node-temp').attr('id', 'node-'+response.id);
              $('#week-preloader').hide();
              var newWeekView = WeeksCollectionView.addOne(w);
              newWeekView.firstEditWeek();
            }
          });
}
		}//end attach
	}//end behav
})(jQuery);
