(function ($){
  Drupal.behaviors.app = {
      attach: function() {
      

      $('#resort-week-container').bind('click', resortWeekOrder);


      $('#add-link').bind('click', addExternalLinkToCourse);
      $('.course-link-item .remove').bind('click', removeExternalLinkFromCourse);
      $('#add-link-popup .save').bind('click', saveExternalLinkToCourse);
      $('#add-link-popup .cancel').bind('click', cancelExternalLinkToCourse);



      

      $('#schedule-button, #link-schedule').bind('click', transitionSchedule);
      $('#updates-button, #link-updates').bind('click', transitionUpdates);
      $('#link-syllabus').bind('click', transitionSyllabus);



      /*
        STEP 0
        Determine the page type from the url
        tutorial or course
      */
      if(pathArray[1] === 'lesson'){


        /* 
          STEP 1
          create the tutorial node Backbone object
          this will be used to fetch the tutorial node which can then tell us which questions
          are related (through node refs), the related assignments, etc - ie. all the things
          we want to load dynamically through Backbone so that the user can dynamically update them
        */
        lessonNid = pathArray[2];//nid from URL
        lesson = new Drupal.Backbone.Models.Node({ nid: lessonNid });//get this from the url eventually

        //attachQuestionAndAnswer(lessonNid);
      }//end if tutorial

      if(pathArray[1] === 'course'){
       
        /* 
          STEP 1
          create the tutorial node Backbone object
          this will be used to fetch the tutorial node which can then tell us which questions
          are related (through node refs), the related assignments, etc - ie. all the things
          we want to load dynamically through Backbone so that the user can dynamically update them
        */
        courseNid = pathArray[2];//nid from URL
        var Course = Drupal.Backbone.Models.Node.extend({ 
          
          initialize: function(opts){
            Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);

            //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
            //needed to take out a bunch when using REST WS - last_view seems to be the culprit
            this.addNoSaveAttributes(['body', 'field_answers_reference',
             'views', 'day_views', 'last_view', 'uri', 'resource', 'id' ]);
          }

        });//get this from the url eventually

        course = new Course({nid: courseNid });

        course.fetch();


        
        ///////////////////////////////////////////////////////////////
        ////////////////// WEEK ///////////////////////////////////////
        ///////////////////////////////////////////////////////////////

        WeeksCollection = new WeekCollectionPrototype();

        //TODO: for some reason the collection is initializing with one model
        //that is undefined, so reset it immediately to clear it out
        WeeksCollection.reset();
        
        WeeksCollectionView = new WeekCollectionViewPrototype({
          collection: WeeksCollection,
          templateSelector: '#week-list',
          renderer: 'underscore',
          el: '#weeks-list-el',
          ItemView: WeekView,
          itemParent: '.week-list-container'
        });
          
        //binds the #week-list html to the DOM
        WeeksCollectionView.render();

        //fill the collection with nodes from the database    
        WeeksCollection.fetchQuery({
          "field_parent_course_nid":pathArray[2],
          "type":"week"
          }, {
            success: function(model, response, options){
              $('#week-preloader').hide();
              $('.week').removeClass('hidden');
              $('.course .weeks .week').each(function(i){
                var weekID = $(this).attr('id');
                if(weekID != "week-preloader"){
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
                  }, {
                    success: function(model, response, options){
                      //remove preloader for lesson for this particular week based on weekID
                      $('.lesson.preloader', '#node-'+weekID).hide();
                      $('.add-lesson', '#node-'+weekID).removeClass('hidden');
                      $('.open', '#node-'+weekID).removeClass('theOpenLesson');
                      $('.lesson-list-container', '#node-'+weekID).sortable();
                      $('.lesson-list-container', '#node-'+weekID).sortable('disable');
                    },
                    error: function(model, xhr, options){
                      //remove preloader for lesson for this particular week based on weekID
                      $('.lesson.preloader', '#node-'+weekID).hide();
                      $('.add-lesson', '#node-'+weekID).removeClass('hidden');
                      $('.lesson.open', '#node-'+weekID).removeClass('theOpenLesson');
                    }

                  });

                }
              });
            },
            error: function(){
              $('#week-preloader').hide();
            }
        });

        $('#add-week-container').bind('click', clickAddWeek);
        $('#add-update-container').bind('click', clickAddUpdate);

        ///////////////////////////////////////////////////////////////
        ////////////////// UPDATES ////////////////////////////////////
        ///////////////////////////////////////////////////////////////


        UpdatesCollection = new UpdateCollectionPrototype();
        UpdatesCollection.reset();

        UpdatesCollectionView = new UpdateCollectionViewPrototype({
          collection: UpdatesCollection,
          templateSelector: '#update-list',
          renderer: 'underscore',
          el: '#updates-list-el',
          ItemView: UpdateView,
          itemParent: '.update-list-container'
        });

        UpdatesCollectionView.render();

        UpdatesCollection.fetchQuery({
          "field_parent_course_nid":pathArray[2],
          "type":"update"
          }, {
            success: function(model, response, options){
              $('#update-preloader').hide();
            }, 
            error: function(){
              $('#update-preloader').hide();
            }
        });

   
        




      }//end if course
    }//end attach
  }//end behav
})(jQuery);
