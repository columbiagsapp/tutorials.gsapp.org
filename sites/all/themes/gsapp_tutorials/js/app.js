var app = app || {};
var pathArray = window.location.pathname.split('/');
var updates_detached = null;
var openLessonView = null;
var openPageView = null;

var COURSE_SUMMARY_CHAR_LEN = 400;
var ANIMATION_TIME = 200;

var WeeksCollection, 
    WeeksCollectionView;

var LessonsCollection,
    LessonsCollectionView;

var Student, StudentsCollection, GroupCollection;

var course,
    courseNid;

var parentLessonView = null;

var EmbedsCollection = [];
var EmbedsCollectionView = [];

var UploadsCollection = [];
var UploadsCollectionView = [];

var PagesCollection = [],
    PagesCollectionView = {};

var tumblr = {};

var FIRST_EDIT_LESSON = 'first-edit-lesson';
var FIRST_EDIT_WEEK = 'first-edit-week';
var FIRST_EDIT_UPDATE = 'first-edit-update';
var FIRST_EDIT_EMBED = 'first-edit-embed';
var FIRST_EDIT_UPLOAD = 'first-edit-upload';
var MODIFIED = 'state-modified';

var lessonEditHallo = {};

lessonEditHallo.placeholder = {};

lessonEditHallo.placeholder.field_description = 'Add description here';
lessonEditHallo.placeholder.title = 'Add title here';
lessonEditHallo.placeholder.field_video_embed = 'Paste Youtube or Vimeo embed code here';

var TumblrHostnameOptionsArray = ['api-test-gsapp'];


var MAX_IMAGE_WIDTH = 500;
var MAX_IMAGE_HEIGHT = 500;


(function ($){
  Drupal.behaviors.app = {
    attach: function() {

      /*
       *  Checks if the current user should have editor privileges, returns true or false
      */
      function isEditor(){
        if( $('body').hasClass('faculty') || $('body').hasClass('ta')  || $('body').hasClass('administrator')){
          return true;
        }else{
          return false;
        }
      }

      function strip(html)
      {
         var tmp = document.createElement("DIV");
         tmp.innerHTML = html;
         return tmp.textContent||tmp.innerText;
      }

      /*
       *  Populates the StudentsCollection collection with all the students in the course as models
      */
      Student = Drupal.Backbone.Models.User.extend();
      var StudentsCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
        model: Student
      });
      StudentsCollection = new StudentsCollectionPrototype();

      function populateStudentsCollection(){
        var students = course.get('field_course_students');

        StudentsCollection.reset();

        for(var i = 0; i < students.length; i++){
          var student = new Student({ "name": 'student'});
          StudentsCollection.add(student);
          if(i == (students.length - 1)){
            student.fetch({
              success: function(){
                return true;
              },
              error: function(){
                return false;
              }
            });
          }else{
            student.fetch();
          }
        }
      }

      function populateGroupsCollection(){

      }

      //Hallo.js seems to apply min-width and min-height to 
      //the editable fields, and I need to strip this out
      function refreshHalloFieldStyles(){
        $('.week-header-top').css('minWidth', '');
      }

      function resortWeekOrder(){
        if($('.resort-text-container', this).text() == 'Resort'){
          $('.week').addClass('resort-mode');

          $('.week-list-container').sortable();
          $('.week-list-container').sortable('enable');
          $('.week-list-container, .week-list-container li').disableSelection();

          $('#add-week-container').hide();
          $('.resort-text-container', this).text('Save Order');
        }else{
          $('.week').removeClass('resort-mode');
          $('.week-list-container').sortable("disable");

          $('.week-list-container, .week-list-container li').enableSelection();

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
          
          $('#add-week-container').show();
          $('.resort-text-container', this).text('Resort');
        }

      }

      $('#resort-week-container').bind('click', resortWeekOrder);

      function hsize(b){
          if(b >= 1048576) return (Math.round((b / 1048576) * 100) / 100) + " mb";
          else if(b >= 1024) return (Math.round((b / 1024) * 100) / 100) + " kb";
          else return b + " b";
      }

      function init_fileuploader(type){
        space_allowed = vars.space_remaining;
        
        var types = vars.filetypes;
        var pattern = new RegExp("(\.|\/)("+types+")$");

        var total_bytes_cal = 0;
        var added_files = new Array();
        //alert(types);
        jQuery('#jquery-file-upload-form').fileupload({//gif|jpe?g|png|tiff|asf|avi|mpe?g|wmv|vob|mov|mp4|flv
          sequentialUploads: true,
          acceptFileTypes: pattern,
          previewMaxWidth: 120,
          maxFileSize: vars.max_file_size,
          change: function (e, data) {
            
            var total_bytes = 0;
            jQuery.each(data.files, function (index, file) {
              //alert(file.name);
              added_files.push(index);
              total_bytes = total_bytes + file.size;   
            });
            if(total_bytes > space_allowed){
              total_bytes_cal = total_bytes;
              var msg = "You have selected to upload a total of " + hsize(total_bytes) + ".\n";
              msg += "However, you only have " + hsize(space_allowed) + " of remaining space.\n";
              alert(msg);
              total_bytes = 0;
            }else{
              total_bytes_cal = 0;
            }
          },
          start: function(e, data){
            //alert(total_bytes_cal);
            if(total_bytes_cal > space_allowed){
              jQuery('button.cancel').trigger('click');
              jQuery('.progress-success').hide();
            }
          },
          added: function(e, data){
            
            if(total_bytes_cal > space_allowed){
              jQuery('button.cancel').trigger('click');
              jQuery('.progress-success').hide();
              //jQuery('.table-striped').hide();
            }
            //total_bytes_cal = 0;
          },
          completed: 
            function(e, data){

              //TODO TCT2003 add logic for deciding the image type
              var upload_file_type = type;
              openLessonView.addUpload(data.result, upload_file_type);

              //openLessonView.saveUploads(data.result, upload_file_type);
            
              jQuery.ajax({
                type: "POST",
                url: vars.base_path+'jquery_file_upload/get_remaining_space', // github.com/troyth added vars.
                success: function(data) {
                  space_allowed = data;
                }
              });
          }
        });
        
        // Load existing files:
        /*
        jQuery('#jquery-file-upload-form').each(function () {
          var that = this;
          jQuery.getJSON(this.action, function (result) {
            if (result && result.length) {
              $(that).fileupload('option', 'done')
              .call(that, null, {
                result: result
              });
            }
          });
        });*/
        
      }

      function appendEmbedElement(this_selector, type, nth){
        var html_array = [];
        html_array.push('<div id="lesson-embed-element-'+nth+'" class="lesson-embed-element">');
          html_array.push('<div class="field-embed-edit-wrapper">');
            html_array.push('<div class="field-embed-edit-top">');
              html_array.push('<label class="field-embed-edit-label">'+ type +' embed code</label>');
              html_array.push('<div class="field-embed-edit-buttons">');
                html_array.push('<div class="remove">Remove</div>');
              html_array.push('</div>');
            html_array.push('</div><!-- /.field-embed-edit-top -->');
            html_array.push('<div class="field-embed-edit-code editable"></div><!-- /.field-embed-edit-code -->');
          html_array.push('</div><!-- /.field-embed-edit-wrapper -->');
          html_array.push('<div class="field-embed-content-wrapper"></div><!-- /.field-embed-content-wrapper -->');
        html_array.push('</div><!-- /#lesson-embed-element-index -->');

        var html_string = html_array.join('');

        $('.lesson-embed-wrapper', this_selector).append( $(html_string) );
      }

      function stripHeightWidthTagsFromIframe(){
        /*
        var video_embed_code = $(this_selector + ' .lesson-video-wrapper .lesson-embed-video-edit-container').html();
        var heightIdxStart = video_embed_code.indexOf('height=');
        var widthIdxStart = video_embed_code.indexOf('width=');

        //remove any given height in the embed code
        if(heightIdxStart >= 0){
          var heightIdxEnd = video_embed_code.indexOf('"', heightIdxStart+8);
          var temp = video_embed_code.substring(0, heightIdxStart);
          var temp2 = video_embed_code.substring(heightIdxEnd+1);
          if(temp2.substr(0,1) == ' '){
            temp2 = temp2.substring(1);
          }
          video_embed_code = temp + temp2;
        }
        //remove any given width in the embed code
        if(widthIdxStart >= 0){
          var widthIdxEnd = video_embed_code.indexOf('"', widthIdxStart+7);
          var temp = video_embed_code.substring(0, widthIdxStart);
          var temp2 = video_embed_code.substring(widthIdxEnd+1);
          if(temp2.substr(0,1) == ' '){
            temp2 = temp2.substring(1);
          }
          video_embed_code = temp + temp2;
        }
        */
      }

      function cancelExternalLinkToCourse(){
        $('#add-link-popup').hide();
        $('#add-link, #add-page').show();

        $('#add-link-popup .new-link-title').hallo({
          editable: false
        }); 

        $('#add-link-popup .new-link-url').hallo({
          editable: false
        });
      }

      function saveExternalLinkToCourse(){
        var links = course.get("field_links");
        var url = $('#add-link-popup .new-link-url').text();

        if( url.substr(4) != "http"){
          var appendURL = "http://" + url;
        }else{
          var appendURL = url;
        }

        var html = $('<div id="course-link-item-' + links.length + '" class="course-link-item"><a class="float-left" href="' + appendURL + '" target="_blank">'+$('#add-link-popup .new-link-title').text()+'</a>&nbsp;&nbsp;<i class="icon-external-link"></i><a class="float-right remove">Remove</a></div>');

        var obj = {
          "title": $('#add-link-popup .new-link-title').text(),
          "url": url
        };

        links.push(obj);
        course.set({
            "field_links": links
          });

        course.save({}, {
          success: function(model, response, options){
            $('#course-links').append( html );
            $('#course-links .remove').bind('click', removeExternalLinkFromCourse);
          },
          error: function(){
            alert('Please re-submit your new link');
          }
        });

        cancelExternalLinkToCourse();

      }

      function removeExternalLinkFromCourse(){
        var links = course.get("field_links");
        var id = $(this).closest('.course-link-item').attr('id');
        id = id.substr(17);
        id = parseInt(id);

        links.splice( id ,1);

        course.set({
            "field_links": links
          });

        course.save({}, {
          success: function(model, response, options){
            $('#course-links #course-link-item-'+ id ).remove();
          },
          error: function(){
            alert('Please try to remove the link again');
          }
        });


        $(this).closest('.course-link-item').remove();
      }

      function addExternalLinkToCourse(){
        $('#add-link-popup').show();
        $('#add-link, #add-page').hide();

        $('#add-link-popup .new-link-title').hallo({
          editable: true,
          placeholder: 'Add link title'
        }); 

        $('#add-link-popup .new-link-url').hallo({
          editable: true,
          placeholder: 'Add link url'
        }); 
      }

      $('#add-link').bind('click', addExternalLinkToCourse);
      $('.course-link-item .remove').bind('click', removeExternalLinkFromCourse);
      $('#add-link-popup .save').bind('click', saveExternalLinkToCourse);
      $('#add-link-popup .cancel').bind('click', cancelExternalLinkToCourse);




      function extractBodyProperty(property){
        var bodyClasses = $('body').attr('class');
        var idxStart = bodyClasses.indexOf(property) + property.length;
        var idxEnd = bodyClasses.indexOf(' ', idxStart);
        if(idxEnd >= 0){
          var returnVal = bodyClasses.substring(idxStart, idxEnd);
        }else{
          var returnVal = bodyClasses.substring(idxStart);
        }
        return returnVal;
      }

      function editSyllabus(){
        if($(this).text() == "Edit"){

          $('#syllabus-content-wrapper').addClass('edit-mode');
          $('#cancel-edit-syllabus-button').show();

          $('#syllabus .syllabus-content').hallo({
            editable: true
          }); 

          $(this).text('Save');

        }else{

          if( $('#syllabus .syllabus-content').hasClass('isModified')){
            var value = $('#syllabus .syllabus-content').html();
            var summary = $('#syllabus .syllabus-content').text();
            summary = summary.substr(0,COURSE_SUMMARY_CHAR_LEN);

            course.set({
              "field_syllabus": {
                "value": value,
                "summary": summary,
                "format": "full_html"
              }
            });
            course.save();
          }

          $('#syllabus .syllabus-content').hallo({
            editable: false
          }); 

          $('#syllabus-content-wrapper').removeClass('edit-mode');
          $('#cancel-edit-syllabus-button').hide();
          $(this).text('Edit');

        }
      }


      function cancelEditSyllabus(){
        $('#syllabus .syllabus-content').html( course.get('field_syllabus').value );

        $('#syllabus .syllabus-content').hallo({
          editable: false
        }); 

        $('#syllabus-content-wrapper').removeClass('edit-mode');
        $('#cancel-edit-syllabus-button').hide();
        $('#edit-syllabus-button').text('Edit');
      }
      
      
      ///////////////////////////////////////////////////////////////
      ////////////////// TRANSITIONS  ///////////////////////////////
      ///////////////////////////////////////////////////////////////

      /*
       *  Clears the main content area, for use in transitions
      */
      function clearContentArea(exception){
        if(exception != 'lesson'){
          if($('#lesson-content').length > 0){
            //remove the temporary lesson model and view
            openLessonView.remove();
            openLessonView = null;

            EmbedsCollection.reset();
            EmbedsCollection = null;
            EmbedsCollectionView = null;

            UploadsCollection.reset();
            UploadsCollection = null;
            UploadsCollectionView = null;

            $('.theOpenLesson').removeClass('theOpenLesson');
            $('.selected').removeClass('selected');

            $('#lesson-content').remove();
          }
        }
        
        if(exception != 'updates'){
          if($('#updates').length > 0){
            if($('#updates').hasClass('span9')){
              $('#updates').switchClass('span9', 'span3 collapsed', ANIMATION_TIME);
              //$('#updates').removeClass('span9').addClass('span3 collapsed');
            }
            updates_detached = $('#updates').detach();
          }
        }

        if(exception != 'schedule'){
          if(!$('#schedule').hasClass('collapsed')){
            //$('#schedule').removeClass('span9').addClass('span3 collapsed');
            $('#schedule').switchClass('span9', 'span3 collapsed', ANIMATION_TIME);
          }
        }

        if(exception != 'syllabus'){
          if($('#syllabus').length > 0){
            $('#syllabus').remove();
          }
        }

        if(exception != 'page'){
          if($('.open-page').length > 0){
            openPageView.remove();
            openPageView = null;
            $('.open-page').remove();
          }
        }
      }
      

      function transitionSyllabus(){
        //only open if not already open
        if($('#syllabus').length <= 0){
          var contentSectionHTML = 
                '<section id="syllabus" class="span9" role="complementary"><div class="float-left heading-button roman"><h2 class="heading float-left">Syllabus</h2><div class="edit-button-container"><div id="edit-syllabus-button" class="edit button">Edit</div><div id="cancel-edit-syllabus-button" class="cancel button">Cancel</div></div></div><div id="syllabus-content-wrapper" class="brick roman"><div class="inner"><div class="syllabus-content editable">';

          contentSectionHTML = contentSectionHTML + course.get('field_syllabus').value + '</div></div></div></section><!-- /.span3 -->';

          clearContentArea('syllabus');

          $('#main').append(contentSectionHTML);

          $('#syllabus .syllabus-content').hallo({
            plugins: {
              'halloformat': {},
              'halloheadings': {},
              'halloblock': {},
              'hallojustify': {},
              'hallolists': {},
              'hallolink': {},
              'halloreundo': {},
              'halloimage': {}
            },
            editable: false,
            toolbar: 'halloToolbarFixed',
            placeholder: 'Add syllabus here'
          }); 

          $('#edit-syllabus-button').bind('click', editSyllabus);
          $('#cancel-edit-syllabus-button').bind('click', cancelEditSyllabus);

          return true;
        }else{
          return false;
        }
      }
      /*
        This function transitions from any state to the main state
        with Schedule in focus and Updates in the sidebar
      */
      function transitionSchedule(){
        clearContentArea('schedule');

        if($('#updates').length <= 0){
          $('#main').append(updates_detached);
        }
        //$('#schedule').removeClass('span3 collapsed').addClass('span9');

        $('#schedule').switchClass('span3 collapsed', 'span9', ANIMATION_TIME);

        return false;
      }

      function transitionUpdates(){

        clearContentArea('updates');

        //if detached, attach first, then open
        if($('#updates').length <= 0){
          $('#main').append(updates_detached);
          $('#updates').removeClass('span3 collapsed').addClass('span9');
        }else{
          $('#updates').switchClass('span3 collapsed', 'span9', ANIMATION_TIME);
        }

        return false;
      }

      $('#schedule-button, #link-schedule').bind('click', transitionSchedule);
      $('#updates-button, #link-updates').bind('click', transitionUpdates);
      $('#link-syllabus').bind('click', transitionSyllabus);


      /*
        First-Edit state is applied when a new object is created but hasn't been saved yet
      */
      function setState(state){
        switch(state){
          case FIRST_EDIT_LESSON:
            console.log('setting state FIRST_EDIT_LESSON');
            $('#main').addClass('state-first-edit-lesson');
            break;
          case FIRST_EDIT_WEEK:
            console.log('setting state FIRST_EDIT_WEEK');
            $('#main').addClass('state-first-edit-week');
            break;
          case FIRST_EDIT_UPDATE:
            console.log('setting state FIRST_EDIT_UPDATE');
            $('#main').addClass('state-first-edit-update');
            break;
          case FIRST_EDIT_EMBED:
            console.log('setting state FIRST_EDIT_EMBED');
            $('#main').addClass('state-first-edit-embed');
            break;
          case FIRST_EDIT_UPLOAD:
            console.log('setting state FIRST_EDIT_UPLOAD');
            $('#main').addClass('state-first-edit-upload');
            break;
          case MODIFIED:
            console.log('setting state MODIFIED');
            $('#main').addClass('state-modified');
            break;
          default:
            break;
        }
      }

      function clearState(state){
        switch(state){
          case FIRST_EDIT_LESSON:
            console.log('clearing state FIRST_EDIT_LESSON');
            $('#main').removeClass('state-first-edit-lesson');
            break;
          case FIRST_EDIT_WEEK:
            console.log('clearing state FIRST_EDIT_WEEK');
            $('#main').removeClass('state-first-edit-week');
            break;
          case FIRST_EDIT_UPDATE:
            console.log('clearing state FIRST_EDIT_UPDATE');
            $('#main').removeClass('state-first-edit-update');
            break;
          case FIRST_EDIT_EMBED:
            console.log('clearing state FIRST_EDIT_EMBED');
            $('#main').removeClass('state-first-edit-embed');
            break;
          case FIRST_EDIT_UPLOAD:
            console.log('clearing state FIRST_EDIT_UPLOAD');
            $('#main').removeClass('state-first-edit-upload');
            break;
          case MODIFIED:
            console.log('clearing state MODIFIED');
            $('#main').removeClass('state-modified');
            break;
          default:
            break;
        }
      }

      function getState(state){
        state = typeof state !== 'undefined' ? state : '';

        switch(state){
          case FIRST_EDIT_LESSON:
            if($('#main').hasClass('state-first-edit-lesson')){
              return true;
            }else{
              return false;
            }
            break;
          case FIRST_EDIT_WEEK:
            if($('#main').hasClass('state-first-edit-week')){
              return true;
            }else{
              return false;
            }
            break;
          case FIRST_EDIT_UPDATE:
            if($('#main').hasClass('state-first-edit-update')){
              return true;
            }else{
              return false;
            }
            break;
          case FIRST_EDIT_EMBED:
            if($('#main').hasClass('state-first-edit-embed')){
              return true;
            }else{
              return false;
            }
            break;
          case FIRST_EDIT_UPLOAD:
            if($('#main').hasClass('state-first-edit-upload')){
              return true;
            }else{
              return false;
            }
            break;
          case MODIFIED:
            if($('#main').hasClass('state-modified')){
              return true;
            }else{
              return false;
            }
            break;
          default:
            var state = $('#main').attr('class');

            var idxStart = state.indexOf('state-');
            var idxEnd = state.indexOf(' ', idxStart+5);
            if(idxEnd >= 0){
              state = state.substring(idxStart, idxEnd);
            }else{
              state = state.substring(idxStart);
            }

            return state;
            break;
        }
      }//end of getState()


      function attachQuestionAndAnswer(lessonNid){
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
          "field_parent_tutorial_nid":lessonNid,
          "type":"question"
        });


        /*
          STEP 8
          Create an empty question for new question to be asked
        */
        $('#question-submit').bind('click',function(){
          var userUID = extractBodyProperty('user-uid-');

          //var user = Drupal.Backbone.Models.User({ "uid": userUID });

          //user.fetch();

          var q = new Question({
            "title": $('#submit-question-title').text(),
            "field_question_votes":"0",
            "field_description": $('#submit-question-question').html(),
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
                "field_parent_tutorial_nid":lessonNid
              });

              q.save();

              openLessonView.initQuestionSubmitHalloEditorsLesson();
            }
          });
          //this can be asyncronous with the server save, meaning that
          //it can update the display even before the server returns a 
          //response (it doesn't have to be in the success callback)
          QuestionsCollectionView.addOne(q);
       
        });

        return true;//TODO TCT2003 DEC 26, 2012 check for errors and throw them instead of returning true
      }//end of attachQuestionAndAnswer()
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
        var lessonNid = pathArray[2];//nid from URL
        var lesson = new Drupal.Backbone.Models.Node({ nid: lessonNid });//get this from the url eventually

        attachQuestionAndAnswer(lessonNid);
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

        course.fetch({
          success: function(model, response, options){
            populateStudentsCollection();
          }
        });



        ///////////////////////////////////////////////////////////////
        ////////////////// TUMBLR  ////////////////////////////////////
        ///////////////////////////////////////////////////////////////


        function sortByTumblrGroups(posts){
          console.log('sortByTumblrGroups()');
          var groups = course.get('field_tumblr_groups');
          groups = groups.split(',');

          var rtn = {};
          rtn.length = groups.length;
          rtn.groups = groups;
          rtn.data = [];

          for(var k = 0; k < groups.length; k++){
            rtn.data[k] = [];
          }

          posts_loop:
          for(var i = 0; i < posts.length; i++){
            
            groups_loop:
            for(var j = 0; j < groups.length; j++){
              var matchString = groups[j];
              var rslt = null;
              $.each(posts[i].tags, function(index, value) { 
                if (rslt == null && (value.toLowerCase() == matchString.toLowerCase() ) ) {
                  rslt = index;
                  return false;
                }
              });

              if(rslt != null){

                rtn.data[j].push(posts[i]);
                break groups_loop;
              }
            }
          }

          console.log('returning from sortByTumblrGroups() with');
          console.dir(rtn);
          return rtn;
        }


        /* Tumblr API functionality, inspired by https://github.com/jokull/tumblr-widget */
        var TumblrFeed = Drupal.Backbone.Models.Node.extend({
          initialize: function(opts){
            Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
            this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id']);
          }
        });

        var TumblrFeedCollection = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: TumblrFeed
        });

        var TumblrFeedView = Drupal.Backbone.Views.Base.extend({
          //the Underscore formated template in node--tutorial.tpl.php stored in a 
          //<script> tag and identified by its id
          templateSelector: '#tumblr_feed_attachment',
          el:'#tumblr-feed-list-el',

          //bind vote up and down events to the buttons and tie these to local functions
          events: {
            "click .edit" : "editTumblrFeed",
            "click .delete": "deleteTumblrFeed",
            "click .cancel": "cancelEditTumblrFeed"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            _.bindAll(this, 'show', 'hide', 'enterEditMode', 'exitEditMode', 'deleteTumblrFeed', 'cancelEditTumblrFeed');
          },

          editTumblrFeed: function(){

            var tumblrfeedID = this.model.get('nid');

            console.log();
            console.log('$(this).text(): '+ $(this).text());

            if($(this).text() == "Edit"){
              
              //initTumblrEditorHallo();

              $(this).text('Save');
              $('.cancel, .delete', '#node-'+tumblrfeedID).show();

            }else{
              
              $('#select2-tumblr-tags').select2('disable');

              //TODO TCT2003
              //these variables should be pulled from divs
              var tumblr_el = '#tumblr-feed-el';
              var hostname = $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-selected-hostname').val();


              var tags = $('#select2-tumblr-tags').select2('val');


              var group = $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-selected-group').val();//($('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-selected-group').val() == 'Group by Student UNI') ? true : false;

              var limit = 20; //set to maximum always

              if($('#tumblr-feed-el').children().length > 0){//not first time
                refreshTumblrFeed();
              }else{
                var lessionID = this.model.get('nid');

                this.model.set({
                  "field_tumblr_hostname": hostname,
                  "field_tumblr_tags": tags.toString(),
                  "field_tumblr_limit": limit,
                  "field_tumblr_grouping": group,
                });            
                
                this.model.save({}, {silent:true});

                initTumblrFeed(tumblr_el, hostname, tags, limit, '');
              }

              $(this).text('Edit');
              $('.cancel, .delete', '#node-'+tumblrfeedID).hide();

            }
          },

          deleteTumblrFeed: function(){
            console.log('deleteTumblrFeed()');
            console.log('nid: '+ this.model.get('nid'));
            //this.model.destroy();
            //this.remove();
          },

          cancelEditTumblrFeed: function(){
            console.log('cancelEditTumblrFeed()');
          },

          show: function(){
            console.log('showing');
            var thisID = this.model.get('nid');
            $('#node-'+thisID).addClass('active');
          },

          hide: function(){
            var thisID = this.model.get('nid');
            $('#node-'+thisID).removeClass('active');
          },
          enterEditMode: function(){
            var thisID = this.model.get('nid');
            $('.tumblr-feed-edit-wrapper', '#node-'+thisID).addClass('edit-mode');
          },
          exitEditMode: function(){
            var thisID = this.model.get('nid');
            $('.tumblr-feed-edit-wrapper', '#node-'+thisID).removeClass('edit-mode');
          }
        });

        var TumblrPost = Backbone.Model.extend({});

        var NextPage = Backbone.View.extend({
          el: "#tumblr .pagination .next",
          events: {
            "click .next": "click"
          },
          initialize: function(options){
            return this.collection.bind("last", this.hide);
          },
          hide: function(){
            return ($(this.el)).hide();
          },
          click: function(e){
            e.preventDefault();
            return this.collection.page();
          }
        });//end NextPage

        var Tumblr = Backbone.Collection.extend({
          model: TumblrPost,
          endpoint: 'http://api.tumblr.com/v2/blog/',
          params: {
            limit: 1
          },
          tags: [],
          initialize: function(options){
            this.endpoint = this.endpoint + options.hostname;
            return this.params = _.extend(this.params, options.params || {});
          },
          page: function(){
            console.log('Tumblr.page()');
            console.log('this.endpoint: '+ this.endpoint);

            var groupByTA = false;
            switch( this.grouping ){
              case 'Group by Student UNI':
                console.log('the grouping: Group by Student UNI');

                break;
              case 'Group by TA':
                groupByTA = true;
                break;
              default://just get everything
                //initTumblrFeed(el, hostname, tags, limit, grouping);
                break;
            }

            var params,
                _this = this;
            params = _.extend(this.params, {
              offset: this.length - 1
            });

          
            console.log('with params: ');
            console.dir(params);

            if(params.tag != null){
              console.log('params.tag != null');

              groupByTA = true;

              if(groupByTA == true){
                console.log('params.tag.length > 1, params.tag: ');
                console.dir(params.tag);

                var tag2 = params.tag[1];

                params.tag = params.tag[0];
                
                console.log('tag2: '+tag2);

                params.tag = params.tag.toString();

                return $.ajax({
                  url: this.endpoint + '.tumblr.com/posts/json?' + ($.param(params)),
                  dataType: "jsonp",
                  jsonp: "jsonp",
                  success: function(data, status){
                    console.log('Tumblr.page.success callback reached wtih data:');
                    console.dir(data);
                    console.log('');

                    console.dir(data.response.posts);

                    sortByTumblrGroups(data.response.posts);

                    _this.add(data.response.posts);
                    _this.trigger('paged');
                    if(data.response.total_posts === _this.length){
                      console.log('Tumblr: triggering last');
                      return _this.trigger('last');
                    }
                  }
                });


                //insert .when here


              }else{
                console.log('params.tag.length == 1, params.tag: ');
                console.dir(params.tag);

                params.tag = params.tag.toString();

                return $.ajax({
                  url: this.endpoint + '.tumblr.com/posts/json?' + ($.param(params)),
                  dataType: "jsonp",
                  jsonp: "jsonp",
                  success: function(data, status){
                    console.log('Tumblr.page.success callback reached wtih data:');
                    console.dir(data);
                    console.log('');

                    _this.add(data.response.posts);
                    _this.trigger('paged');
                    if(data.response.total_posts === _this.length){
                      console.log('Tumblr: triggering last');
                      return _this.trigger('last');
                    }
                  }
                });
              }
            }else{
              console.log('no tags');
              return $.ajax({
                url: this.endpoint + '.tumblr.com/posts/json?' + ($.param(params)),
                dataType: "jsonp",
                jsonp: "jsonp",
                success: function(data, status){
                  console.log('Tumblr.page.success callback reached wtih data:');
                  console.dir(data);
                  console.log('');

                  _this.add(data.response.posts);
                  _this.trigger('paged');
                  if(data.response.total_posts === _this.length){
                    console.log('Tumblr: triggering last');
                    return _this.trigger('last');
                  }
                }
              });
            }
          }
        });//end Tumblr

        function getPostsByTag(url, params) {
           return $.ajax({
            url: 'http://mypage.tumblr.com/api/read/json?tagged=' + tag,
            type: 'GET',
            dataType: 'jsonp'
          });
        };
/*
        $.when(getPostsByTag('tag1'), getPostsByTag('tag2'), getPostsByTag('tag3'))
         .then(function() {
           var posts = $.extend({}, arguments);
           renderStuff(posts);
         });
*/

        var TumblrPostView = Backbone.View.extend({
          className: "tumblr-post",
          initialize: function(options){
            if(this.model) return this.model.bind("change", this.render);
          },
          render: function(){
            var tpl;
            tpl = _.template(($('#tpl-tumblr-post')).html());
            ($(this.el)).addClass(this.model.get('type'));
            ($(this.el)).addClass('span4');
            ($(this.el)).html(tpl(this.model.toJSON()));

            return this;
          }
        });//end TumblrPostView

        var TumblrView = Backbone.View.extend({
          initialize: function(options){
            this.collection.bind("reset", this.all);
            //when the Tumblr collection gets added to, call it's view's add too
            return this.collection.bind('add', this.add, this);
          },
          all: function(){
            ($(this.el)).html('');
            return this.collection.each(this.add);
          },
          add: function(model){
            model.view = new TumblrPostView({
              model: model
            });        

            return ($(this.el)).append(model.view.render().el);
          }
        });//end TumblrView


        function initTumblrFeed(el, hostname, tags, limit, grouping){
          console.log('initTumblrFeed(): grouping: '+ grouping);

          console.log('el: '+ el);
          console.log('hostname: '+ hostname);
          console.log('limit: '+ limit);
          console.dir(tags);

          limit = limit || 1;

          tumblr.collection = new Tumblr({
            hostname: hostname,
            params: {
                api_key: 'yqwrB2k7eYTxGvQge4S8k9R6wAdQrATjLXhVzGVPgjTXwucNOo'
               ,limit: limit
               ,tag: tags
            },
            grouping: grouping
          });
          tumblr.view = new TumblrView({
            el: el,
            collection: tumblr.collection
          });

          tumblr.collection.page();

          tumblr.nextPage = new NextPage({
            collection: tumblr.collection
          });

        }












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

        var Embed = Drupal.Backbone.Models.Node.extend({
          initialize: function(opts){
            Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
            //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
            //needed to take out a bunch when using REST WS - last_view seems to be the culprit
            this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id']);
          },
          testFunction: function(){
          }
        });

        var Upload = Drupal.Backbone.Models.Node.extend({
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
         
          //_openLessonView: null,

          //bind vote up and down events to the buttons and tie these to local functions
          events: {
            "click .lesson": "openLesson"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);//this calls the fetch
            //this._openLessonView = [];
          },

          openLesson: function(){

            console.log('** openLesson()');

            parentLessonView = this;

            var NID = this.model.get('nid');
            var this_selector = '#node-' + NID;

            //don't click through if in edit mode
            if(!$(this_selector).closest('.week').hasClass('edit-mode')){
              var different_week = true;
              var contentSectionHTML = 
              '<section id="lesson-content" class="span9" role="complementary"><div class="float-left heading-button roman"></div><div id="lesson-content-el" class="el"></div></section><!-- /.span3 -->';

              //if a lesson is already open, make sure to close it and 
              //return it to the schedule
              if($('.lesson-open').length > 0){
                $('.selected').removeClass('selected');
                $('.theOpenLesson').removeClass('theOpenLesson');

                contentSectionHTML = '';

                openLessonView.remove();
                openLessonView = null;
                //openLessonView = null;

                //need to replace the el, the view.remove() clears it
                $('#lesson-content').append('<div id="lesson-content-el" class="el"></div>');
              }else{
                //$('#schedule').removeClass('span9').addClass('span3 collapsed');
                clearContentArea('lesson');

                $('#main').append(contentSectionHTML);
              }
              
              $(this_selector).closest('.week').addClass('selected');
              $(this_selector).addClass('theOpenLesson');

              //create new child LessonOpenView to this LessonView
              openLessonView = new LessonOpenView({
                model: this.model
              });

              openLessonView.render(); 

              openLessonView.initEmbedsCollectionAndView(NID);
              openLessonView.initUploadsCollectionAndView(NID);

              openLessonView.initHalloEditorLesson(false);

              //attach any embeds
              openLessonView.attachEmbed();
              openLessonView.attachUpload();

              openLessonView.renderAddons();

              $('html, body').animate({scrollTop:0}, 'slow');

              refreshHalloFieldStyles();


              //point the global openLessonView to the new LessonOpenView
              //openLessonView = this._openLessonView;

              return true;
            }else{
              return false;
            }

          },

          firstEditLesson: function(){
            setState(FIRST_EDIT_LESSON);

            //can't call edit lesson until finished with openLesson
            if( this.openLesson() ){
              openLessonView.enableHalloEditorsLesson();
              openLessonView.editLesson();
            }
          }

        });//end LessonView


        var LessonOpenView = Drupal.Backbone.Views.Base.extend({
          //the Underscore formated template in node--tutorial.tpl.php stored in a 
          //<script> tag and identified by its id
          templateSelector: '#bb_lesson_open_template',
          el: '#lesson-content-el',
          
          placeholder: {
            title: "Add a title new",
            field_description: "Add body text new",
            field_embed_code: "Paste embed code here",
            field_question_submit: "Write your question here"
          },

          //bind vote up and down events to the buttons and tie these to local functions
          events: {
            "click .edit" : "editLesson",
            "click .delete": "deleteLesson",
            "click .cancel": "cancelEdit",
            "click .button-embed-video": "addVideoEmbed",
            "click .button-embed-slideshare": "addSlideshareEmbed",
            "click .button-embed-scribd": "addScribdEmbed",
            "click .button-embed-soundcloud": "addSoundcloudEmbed",

            "click .button-upload-image": "uploadImageFile",
            "click .button-upload-pdf": "uploadPDFFile",
            "click .button-upload-code": "uploadCodeFile",
            "click .button-upload-file": "uploadFileFile",
            "click .button-addon-tumblr": "addOnTumblr",
            "click .button-addon-qanda": "addOnQandA"
          },

          render: function(variables, el){
            Drupal.Backbone.Views.Base.prototype.render.call(this, variables, el);
            //this.renderAddons();
          },

          initUploadsCollectionAndView: function(lessonID){
            //empty container arrays if they already have embed collection
            //and collection view
            UploadsCollection = null;
            UploadsCollectionView = null;

            UploadsCollection = new UploadCollectionPrototype();
            UploadsCollection.reset();
            //put the embeds collection at the front of the container array
            //this.embedsCollection.unshift(EmbedsCollection);

            var theEL = '#open-node-' + lessonID + ' .uploads-list-el';

            UploadsCollectionView = new UploadCollectionViewPrototype({
              collection: UploadsCollection,
              templateSelector: '#upload-list',
              renderer: 'underscore',
              el: theEL,
              ItemView: UploadView,
              itemParent: '.upload-list-container'
            });

            UploadsCollectionView.render();
            //put the embeds collection view at the front of the container array
            //this.embedsCollectionView.unshift(EmbedsCollectionView);
          },

          initEmbedsCollectionAndView: function(lessonID){
            //empty container arrays if they already have embed collection
            //and collection view
            EmbedsCollection = null;
            EmbedsCollectionView = null;

            EmbedsCollection = new EmbedCollectionPrototype();
            EmbedsCollection.reset();
            //put the embeds collection at the front of the container array
            //this.embedsCollection.unshift(EmbedsCollection);

            var theEL = '#open-node-' + lessonID + ' .embeds-list-el';

            EmbedsCollectionView = new EmbedCollectionViewPrototype({
              collection: EmbedsCollection,
              templateSelector: '#embed-list',
              renderer: 'underscore',
              el: theEL,
              ItemView: EmbedView,
              itemParent: '.embed-list-container'
            });

            EmbedsCollectionView.render();
            //put the embeds collection view at the front of the container array
            //this.embedsCollectionView.unshift(EmbedsCollectionView);
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);

            this.model.bind('change', this.render, this);//this calls the fetch

            _(this).bindAll('editTumblrAddon');
          },

          /*
            Enables Hallo.js editor for title and body
          */
          enableHalloEditorsLesson: function(){
            this.initHalloEditorLesson(true);

            $('.lesson-open .lesson-embed-element').each(function(){
              $('.field-embed-edit-code', this).hallo({
                editable: true
              });
            });

          },

          /*
            Disables Hallo.js editor for title and body
          */
          disableHalloEditorsLesson: function(){
            $('.lesson-open .lesson-title').hallo({
              editable: false
            });

            /*
            $('.lesson-open .lesson-description').hallo({
              editable: false
            });
            */
            $('.lesson-open .lesson-embed-element').each(function(){
              $('.field-embed-edit-code', this).hallo({
                editable: false
              });
            });

          },

          /*
            Initializes Hallo.js editor for title and body with placeholders
            for the first opening of a lesson
          */
          initHalloEditorLesson: function(editmode){
            console.log('initHalloEditorLesson()');
            //launch Hallo.js
            $('.lesson-open .lesson-title').hallo({
              plugins: {
                'halloreundo': {}
              },
              editable: editmode,
              toolbar: 'halloToolbarFixed',
              placeholder: 'Optional subtitle'
            });



            function prepareIframe(widget) {
              var iframe, iframeName;
              iframeName = "" + widget.widgetName + "_postframe_" + widget.options.uuid;
              iframeName = iframeName.replace(/-/g, '_');
              iframe = jQuery("#" + iframeName);
              if (iframe.length) {
                return iframe;
              }
              iframe = jQuery("<iframe name=\"" + iframeName + "\" id=\"" + iframeName + "\"        class=\"hidden\" style=\"display:none\" />");
              this.element.append(iframe);
              iframe.get(0).name = iframeName;
              return iframe;
            }
            function iframeUpload(data) {
              console.log('YEEESSSSS');

              var iframe, uploadForm, uploadUrl, widget;
              widget = data.widget;
              iframe = widget._prepareIframe(widget);
              uploadForm = jQuery('form.upload', widget.element);
              if (typeof widget.options.uploadUrl === 'function') {
                uploadUrl = widget.options.uploadUrl(widget.options.entity);
              } else {
                uploadUrl = widget.options.uploadUrl;
              }
              iframe.on('load', function(e) {
                console.log( 'returned from load iframe' );
                console.dir(iframe);

                var imageUrl;
                imageUrl = iframe.get(0).contentWindow.location.href;
                widget.element.hide();

                console.log('imageUrl: '+ imageUrl);

                var selector = '#' + iframe.get(0).id;

                var res = $(selector).contents().find('pre').text();

                var resObj = $.parseJSON(res);

                console.dir(resObj);


                console.log("selector: "+ selector + "  res: "+ res);


                var origWidth = resObj.width;
                var origHeight = resObj.height;

                if((origWidth > MAX_IMAGE_WIDTH) || (origHeight > MAX_IMAGE_HEIGHT)){
                  var aspectRatio = parseInt(origWidth) / parseInt(origHeight);
                  

                }


                var imgHTML = '<img src="' + resObj.url + '">';

                var origHTML = $('.lesson-open .lesson-description').html();

                if( origHTML == "Add description" ){
                  origHTML = '';
                }

                var newHTML = origHTML + imgHTML;

                $('.lesson-open .lesson-description').html( newHTML );

                return data.success(imageUrl);
              });
              uploadForm.attr('action', uploadUrl);
              uploadForm.attr('method', 'post');
              uploadForm.attr('target', iframe.get(0).name);
              uploadForm.attr('enctype', 'multipart/form-data');
              uploadForm.attr('encoding', 'multipart/form-data');
              return uploadForm.submit();
            }


            function jQueryFormUpload(data){
              var iframe, uploadForm, uploadUrl, widget;
              widget = data.widget;
              uploadForm = jQuery('form.upload', widget.element);
              if (typeof widget.options.uploadUrl === 'function') {
                uploadUrl = widget.options.uploadUrl(widget.options.entity);
              } else {
                uploadUrl = widget.options.uploadUrl;
              }



              uploadForm.attr('action', uploadUrl);
              uploadForm.attr('method', 'post');
              uploadForm.attr('target', iframe.get(0).name);
              uploadForm.attr('enctype', 'multipart/form-data');
              uploadForm.attr('encoding', 'multipart/form-data');
              return uploadForm.ajaxSubmit();

            }

            //widget.options.imageWidget

            $('.lesson-open .lesson-description').hallo({
              plugins: {
                'halloformat': {},
                'hallolists': {},
                'hallojustify': {},
                'hallolink': {},
                'halloreundo': {},
                'halloimage': {
                  uploadUrl: "http://tutorials-test7.postfog.org/hallo_image_upload/upload",
                  upload: iframeUpload
                }
              },
              editable: editmode,
              toolbar: 'halloToolbarFixed',
              placeholder: 'Add description'
            });    


            //$('body #main').append('<div class="field-type-file field-name-field-assignment-attachment field-widget-file-generic form-wrapper" id="edit-field-assignment-attachment"><div id="edit-field-assignment-attachment-und-0-ajax-wrapper"><div class="form-item form-type-managed-file form-item-field-assignment-attachment-und-0"><label for="edit-field-assignment-attachment-und-0">Assignment Attachment </label><div class="file-widget form-managed-file clearfix"><input type="file" id="edit-field-assignment-attachment-und-0-upload" name="files[field_assignment_attachment_und_0]" size="22" class="form-file" /><input type="submit" id="edit-field-assignment-attachment-und-0-upload-button" name="field_assignment_attachment_und_0_upload_button" value="Upload" class="form-submit" /><input type="hidden" name="field_assignment_attachment[und][0][fid]" value="0" /><input type="hidden" name="field_assignment_attachment[und][0][display]" value="1" /></div><div class="description">A PDF of the assignment<br />Files must be less than <strong>5 MB</strong>.<br />Allowed file types: <strong>txt pdf doc</strong>.</div></div></div>');
          },

          initQuestionSubmitHalloEditorsLesson: function(){

            if($('#submit-question-title').text().length > 0){
              $('#submit-question-title').text('');
            }

            if($('#submit-question-question').html().length > 0){
              $('#submit-question-question').html('');
            }

            $('#submit-question-title').hallo({
              plugins: {
                'halloreundo': {}
              },
              editable: true,
              toolbar: 'halloToolbarFixed',
              placeholder: 'Add question title'
            });

            $('#submit-question-question').hallo({
              plugins: {
                'halloformat': {},
                'halloimage': {},
                'halloblock': {},
                'hallojustify': {},
                'hallolists': {},
                'hallolink': {},
                'halloreundo': {}
              },
              editable: true,
              toolbar: 'halloToolbarFixed',
              placeholder: 'Add question content'
            }); 
          },

          saveUploads: function(newModel){
            //if EmbedsCollection is empty, need to re-initialize
            if(UploadsCollection.length == 0){
              thisLessonOpenView.initUploadsCollectionAndView(lessonID);
              thisLessonOpenView.attachUpload();
            }else{
              var newUploadView = UploadsCollectionView.addOne(newModel);
              //TODO TCT2003 don't think i need this
              //newUploadView.firstEditUpload();
            }

            console.dir(data);

            var thisLessonOpenView = this;

            var lessonID = this.model.get('nid');
            var uploadsArray = [];//returned to Lesson to be stored in field_uploads[]

            //if the open lesson already has uploads, and therefore an UploadsCollectionView
            if(UploadsCollectionView._itemViews.length > 0){
              var UCV_iVLength = UploadsCollectionView._itemViews.length;

              for(var i = 0; i < UCV_iVLength; i++){
                var uploadView = UploadsCollectionView._itemViews[i];

                var uploadID = uploadView.model.get('nid');
                var upload_selector = '#node-' + uploadID;

                uploadsArray.push( data_upload_type );
                
                uploadView.model.set({
                  "field_upload_type": data_upload_type,
                  "field_upload_url": data.url,
                  "field_delete_url": data.delete_url,
                  "field_delete_http_method": data.delete_type,
                  "field_upload_filename": data.name,
                  "title": 'upload-'+data.name,
                  "field_upload_filesize": data.size,
                  "type": "upload"
                });

                //only fire the success callbacks to re-init UploadsCollection and UploadsCollectionView for the last one
                if( (i == (UCV_iVLength - 1)) && ( getState(FIRST_EDIT_LESSON) || getState(FIRST_EDIT_UPLOAD) ) ){
                  uploadView.model.save({},{
                    
                    success: function(model, response, options){
                      thisLessonOpenView.initUploadsCollectionAndView(lessonID);
                      thisLessonOpenView.attachUpload();

                    },
                    error: function(model, xhr, options){
                      thisLessonOpenView.initUploadsCollectionAndView(lessonID);
                      thisLessonOpenView.attachUpload();
                    }
                  });

                }else{
                  uploadView.model.save();
                }

                  
              }//end for
            }else{
              thisLessonOpenView.initUploadsCollectionAndView(lessonID);
              thisLessonOpenView.attachUpload();
            }

            clearState(FIRST_EDIT_UPLOAD);
            //setState(MODIFIED);

            return uploadsArray.join(',');
          },

          saveEmbeds: function(){
            var thisLessonOpenView = this;

            var lessonID = this.model.get('nid');
            var embedsArray = [];

            if(EmbedsCollectionView._itemViews.length > 0){
              var ECV_iVLength = EmbedsCollectionView._itemViews.length;

              for(var i = 0; i < ECV_iVLength; i++){
                var embedView = EmbedsCollectionView._itemViews[i];

                var embedID = embedView.model.get('nid');
                var embed_selector = '#node-' + embedID;
                var embed_type = $('.field-embed-edit-label .type-code', embed_selector).text();
                var embed_code = $('.field-embed-edit-code', embed_selector).text();

                embedsArray.push( embed_type );
                
                embedView.model.set({
                  "field_embed_type": embed_type,
                  "field_embed_code": embed_code,
                  "type": "embed"
                });

                //only fire for the last 
                if( i == (ECV_iVLength - 1) ){
                  embedView.model.save({},{
                    success: function(model, response, options){
                      thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
                      thisLessonOpenView.attachEmbed();

                    },
                    error: function(model, xhr, options){
                      thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
                      thisLessonOpenView.attachEmbed();
                    }
                  });

                }else{
                  embedView.model.save();
                }              
              }//end for
            }else{
              thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
              thisLessonOpenView.attachEmbed();
            }

            clearState(FIRST_EDIT_EMBED);

            return embedsArray.join(',');
          },

          attachUpload: function(){
            var lessonID = this.model.get("nid");
            //this.initEmbedsCollectionAndView(lessonID);

            //TODO TCT2003 WED DEC 19, 2012 need to figure out how to get the week nid dynamically?
            UploadsCollection.fetchQuery({
              "field_parent_lesson_nid":lessonID,
              "type":"upload"
            }, {
              success: function(model, response, options){
                //remove preloader for lesson for this particular week based on weekID
                $('.upload.preloader', '#open-node-'+lessonID).hide();
                $('.attachments-header').removeClass('hidden');
                //TODO TCT2003 add "remove" button
              },
              error: function(model, xhr, options){
                //remove preloader for lesson for this particular week based on weekID
                $('.upload.preloader', '#open-node-'+lessonID).hide();
              }

            });
          },

          attachEmbed: function(){
            var lessonID = this.model.get("nid");
            //this.initEmbedsCollectionAndView(lessonID);

            //TODO TCT2003 WED DEC 19, 2012 need to figure out how to get the week nid dynamically?
            EmbedsCollection.fetchQuery({
              "field_parent_lesson_nid":lessonID,
              "type":"embed"
            }, {
              success: function(model, response, options){
                //remove preloader for lesson for this particular week based on weekID
                $('.embed.preloader', '#open-node-'+lessonID).hide();
                $('.lesson-embed-element', '#open-node-'+lessonID).each(function(){
                  $('.field-embed-edit-code', this).text( $('.field-embed-content-wrapper', this).html() );

                  $('.field-embed-edit-code', this).hallo({
                    plugins: {
                      'halloreundo': {}
                    },
                    editable: true,
                    toolbar: 'halloToolbarFixed',
                    placeholder: 'Paste embed code here'
                  });
                });
              },
              error: function(model, xhr, options){
                //remove preloader for lesson for this particular week based on weekID
                $('.embed.preloader', '#open-node-'+lessonID).hide();
              }

            });
          },

          editLesson: function(){
            var lessonID = this.model.get('nid');
            var this_selector = '#open-node-' + lessonID;
            
            //user clicked button to go into edit mode
            if($('.edit', this_selector).text() == "Edit"){
              $('.edit', this_selector).text('Save');//switch button text to Save
              $(this_selector).addClass('edit-mode');

              //populate embed-edit-code fields for each embed element with html as plain text
              $('.lesson-embed-element', this_selector).each(function(){
                var embed_html = $('.field-embed-content-wrapper', this).html();
                if(embed_html != undefined){
                  if(embed_html.length > 0){
                    $('.field-embed-edit-code', this).text( embed_html );
                  }
                }
              });

              this.enableHalloEditorsLesson();
            }
            //user clicked button to save changes
            else{
              //strip html from description for the schedule/week lesson description summary
              if( $(this_selector + ' .lesson-title').hasClass('isModified') ) {
                setState(MODIFIED);
                var theTitle = $(this_selector + ' .lesson-title').text();
              }else{
                var theTitle = this.model.get("title");
              }

              if( $('.lesson-description', this_selector).hasClass('isModified') ) {
                setState(MODIFIED);
                var description = $('.lesson-description', this_selector).html();
                var description_summary = strip(description);
              }else{
                var description = this.model.get("field_description");
                var description_summary = this.model.get("field_description_summary");
              }

              //Iterate through all models in the EmbedsCollection and 
              //save out the values
              var embeds = this.saveEmbeds();

            //  this.attachUpload();
              //var uploads = this.saveUploads();//only call on init_fileuploader:completed()

              //TODO TCT2003 add this.saveUploads();

              if(description_summary.length > 180){
                description_summary = description_summary.substr(0,180) + '...';
              }

              this.model.set({
                "title": theTitle,
                "field_description": description,
                "field_description_summary": description_summary,
                "field_embeds": embeds
              });

              var thisLessonOpenView = this;

              this.model.save({},{
                success: function(){//TODO TCT2003 why do I have to refetch these?
                  //$('.embed.preloader', thisLessonOpenView).remove(); 
                  //$('.upload.preloader', thisLessonOpenView).remove(); 
                  //if(getState(MODIFIED)){
                    thisLessonOpenView.initUploadsCollectionAndView(lessonID);
                    thisLessonOpenView.attachUpload();

                    clearState(MODIFIED);
                  //}
                },
                error: function(){
                  $('.embed.preloader', thisLessonOpenView).hide(); 
                  $('.upload.preloader', thisLessonOpenView).hide(); 
                  //dont clear modified state b/c hasn't been modified yet?
                  //TODO TCT2003 need to throw alert
                  //if(getState(MODIFIED)){
                    thisLessonOpenView.initUploadsCollectionAndView(lessonID);
                    thisLessonOpenView.attachUpload();

                    clearState(MODIFIED);
                  //}
                }
              });

              this.model.trigger('change');//force reload of embeds and uploads

              /* Not used any more because Q&A no longer a default
              if(getState(FIRST_EDIT_LESSON)){
                this.initQuestionSubmitHalloEditorsLesson();
              }
              */
              clearState(FIRST_EDIT_LESSON);

              this.cancelEdit();
            }//end of save mode
          },

          deleteLesson: function(){
            //delete the actual model from the database and its view
            //var weekID = $('.open').closest('.week').attr('id');
            //weekID = weekID.substr(5);
            //LessonsCollectionView[weekID].remove(this.model);
            this.model.destroy();
            this.remove();

            //TODO TCT2003 do I need the .open remove?
            if( getState(FIRST_EDIT_LESSON) ){
              $('.open').remove();
            }
            //clear the temporary lesson model and view and transition to 
            //the main configuration
            transitionSchedule();
          },

          cancelEdit: function(){
            var lessonID = this.model.get('nid');
            var this_selector = '#open-node-' + lessonID;
            //disable Hallo.js editors
            //this.disableHalloEditorsLesson();
            if( getState(FIRST_EDIT_LESSON) ){
              clearState(FIRST_EDIT_LESSON);
              //TODO TCT2003 do I need to save the model first?

              this.model.save();
              //remove from the DOM (only useful when )
              var thisID = this.model.get('nid');
              $('#node-'+thisID).closest('li').remove();
              this.deleteLesson();
            }else{
              $('.edit', this_selector).text('Edit');
              $(this_selector).removeClass('edit-mode');

              
              //TODO SOON TCT2003 
              //Revert textarea values to database values (works for save and cancel b/c already saved to local memory)
              //$('textarea.lesson-title', this_selector).val( this.model.get('title') );
              //$('textarea.lesson-description', this_selector).val( this.model.get('field_description') );

              //so it doesn't show up in the collapsed week list when you click save for the first time on a new lesson
              
              
            }
            //add the theOpenLesson class to the open lesson in the schedule
            $('.selected .lesson').each(function(i){
              var selector = 'node-' + lessonID;

              if($(this).attr('id') == selector){
                $(this).addClass('theOpenLesson');
                return false;
              }
            });
            
          },

          addUpload: function(result, uploadType){
            var thisLessonOpenView = this;
            var courseID = $('.course').attr('id');
            courseID = courseID.substring(5);

            var lessonID = this.model.get('nid');
            var upload_title = "upload-"+result.name;

            var f = new Upload({
              "title": upload_title,
              "field_upload_type": uploadType,
              "type": "upload",
              "field_parent_lesson_nid":lessonID,
              "field_parent_course_nid":courseID,
              "field_upload_url": result.url,
              "field_delete_url": result.delete_url,
              "field_delete_http_method": result.delete_type,
              "field_upload_filename": result.name,
              "field_upload_filesize": result.size,
              "type": "upload"
            });


            //need to set this explicitly for a node create
            //because the Drupal Backbone module doesn't know
            //when the node is new... must be a better way!
            f.url = "/node";

            setState(MODIFIED);

            var resp = f.save({}, {
              success: function(model, response, options){
                //not sure why the BB drupal module can't handle this
                //need to set the model's id explicitly, otherwise it
                //triggers the isNew() function in backbone.js and it
                //tries to create a new one in the db, and because I 
                //over rode the url because it was originally new,
                //I need to re-instate the url
                //TOOD: I should fix this in the Drupal BB module
                f.id = response.id;
                f.url = "/node/" + response.id + ".json";
                f.set({
                  "nid":response.id
                });
                f.save();

                //TODO TCT2003 why doesn't this.embedsCollectionView[0] work? it says it's undefined!!
                
                setState(FIRST_EDIT_UPLOAD);


                //thisLessonOpenView.saveUploads(f);


                var newUploadView = UploadsCollectionView.addOne(f);

                var uploads = [];
                //loop through each upload in UploadsCollection and push it's type into uploads[]
                _.each(UploadsCollection.models, function(element, index, list){
                  var type = element.get('field_upload_type');
                  if($.inArray(type, uploads) < 0){
                    uploads.push( element.get('field_upload_type') );
                  }else{
                    uploads.push( element.get('field_upload_type') );
                  }
                });

                uploads = uploads.join(',');

                thisLessonOpenView.model.set({
                  "field_uploads": uploads
                }, {silent: true});

                /*

                thisLessonOpenView.model.save({}, {
                  success: function(){
                    console.log('saved file type into lesson');
                    $('.attachments-header').removeClass('hidden');
                    $('#fileupload-modal').modal('hide');

                  }
                });

*/
                  
                //thisLessonOpenView.initUploadsCollectionAndView(lessonID);
        //        thisLessonOpenView.attachUpload();
                     
              }
            });
          },//end addUpload()

          addEmbed: function(embedType){
            var thisLessonOpenView = this;
            var courseID = $('.course').attr('id');
            courseID = courseID.substring(5);

            var lessonID = this.model.get('nid');
            var embed_title = "embeddedTo"+lessonID;

            var e = new Embed({
              "title": embed_title,
              "field_embed_type": embedType,
              "type": "embed",
              "field_parent_lesson_nid":lessonID,
              "field_parent_course_nid":courseID
            });

            //need to set this explicitly for a node create
            //because the Drupal Backbone module doesn't know
            //when the node is new... must be a better way!
            e.url = "/node";

            $('.embed.preloader', '#node-'+lessonID).show();

            var resp = e.save({}, {
              success: function(model, response, options){
                $('.embed.preloader', '#node-'+lessonID).hide();
                //not sure why the BB drupal module can't handle this
                //need to set the model's id explicitly, otherwise it
                //triggers the isNew() function in backbone.js and it
                //tries to create a new one in the db, and because I 
                //over rode the url because it was originally new,
                //I need to re-instate the url
                //TOOD: I should fix this in the Drupal BB module
                e.id = response.id;
                e.url = "/node/" + response.id + ".json";
                e.set({
                  "nid":response.id
                });
                e.save();

                //TODO TCT2003 why doesn't this.embedsCollectionView[0] work? it says it's undefined!!

                setState(MODIFIED);

                //if EmbedsCollection is empty, need to re-initialize
                if(EmbedsCollection.length == 0){
                  thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
                  thisLessonOpenView.attachEmbed();
                }else{
                  var newEmbedView = EmbedsCollectionView.addOne(e);
                  newEmbedView.firstEditEmbed();
                }
              },
              error: function(){
                $('.embed.preloader', '#node-'+lessonID).hide();
              }
            });
          },//end addEmbed()

          /*
            Triggered when the user clicks the Youtube/Vimeo button from the 
            Embed dropdown menu in edit-mode
          */
          addVideoEmbed: function(){
            this.addEmbed('Video');
          },

          addSoundcloudEmbed: function(){
            this.addEmbed('Soundcloud');
          },
          addSlideshareEmbed: function(){
            this.addEmbed('Slideshare');
          },
          addScribdEmbed: function(){
            this.addEmbed('Scribd');
          },

          uploadImageFile: function(){
            init_fileuploader('image');
            $('#fileupload-modal').modal('show');
            return false;
          },

          uploadPDFFile: function(){
            init_fileuploader('pdf');
            $('#fileupload-modal').modal('show');
            return false;
          },

          uploadCodeFile: function(){
            init_fileuploader('code');
            $('#fileupload-modal').modal('show');
            return false;
          },

          uploadFileFile: function(){
            init_fileuploader('file');
            $('#fileupload-modal').modal('show');
            return false;
          },

          uploadAssignmentFile: function(){
            init_fileuploader('assignment');
            $('#fileupload-modal').modal('show');

            //TODO TCT2003 add assignment to the lesson field_has_assignment

            return false;
          },

          addOnQandA: function(){
            //add tumblr to list of addons
            //TODO TCT2003 move this to a saveAddon() function
            var addons = this.model.get('field_addons');
            if(addons != null){
              if(addons.indexOf('qanda') < 0){
                addons = addons + ',qanda';
              }
            }else{
              addons = 'qanda';
            }
            this.model.set({
              "field_addons": addons
            });

            this.model.save({}, {silent:true});

            if( this.appendQandA() ){
              $('#lesson-addon-nav li.active').removeClass('active');
              $('.nav-qanda').addClass('active');
              $('.addon.active').removeClass('active');
              $('#lesson-attachment-questions-wrapper').addClass('active');
            }

          },

          appendQandA: function(){
            var navHTML = '<li class="inline nav-qanda"><h2 class="inline">Q&amp;A</h2></li>';
            $('#lesson-addon-nav').append( navHTML );

            var QandAhtmlArray = [];

            QandAhtmlArray.push('<div id="lesson-attachment-questions-wrapper" class="addon">');
              QandAhtmlArray.push('<div id="questions-list-el"></div>');
                QandAhtmlArray.push('<div class="add-question brick roman edit-mode">');
                  QandAhtmlArray.push('<div class="inner">');
                    QandAhtmlArray.push('<h4 class="float-left">Ask a question</h4>');
                    QandAhtmlArray.push('<div class="submit-question-buttons float-right">');
                      QandAhtmlArray.push('<div id="question-submit" class="button save">Save</div>');
                      QandAhtmlArray.push('<div id="question-submit-cancel" class="button cancel">Cancel</div>');
                    QandAhtmlArray.push('</div>');
                    QandAhtmlArray.push('<div class="roman float-left submit-question-content-container">');
                      QandAhtmlArray.push('<h2><div id="submit-question-title" class="editable"></div></h2>');
                      QandAhtmlArray.push('<div id="submit-question-question" class="editable"></div>');
                    QandAhtmlArray.push('</div>');
                  QandAhtmlArray.push('</div><!-- /.inner -->');
                QandAhtmlArray.push('</div><!-- /.add-question -->');
              QandAhtmlArray.push('</div><!-- /#questions-list-el-->');
            QandAhtmlArray.push('</div><!-- /#lesson-attachment-questions-wrapper -->');

            var QandAhtml = QandAhtmlArray.join('');

            $('#lesson-attachment-content').append( QandAhtml );

            if(attachQuestionAndAnswer(this.model.get('nid'))){
              this.initQuestionSubmitHalloEditorsLesson();
            }

            return true;

          },

          editTumblrAddon: function(){
            console.log('editTumblrAddon()');

            if($(this).text == "Edit"){
              $('#tumblr-wrapper').addClass('edit-mode');
              initTumblrEditorHallo();

              

              
              

            }else{              

              $('#select2-tumblr-tags').select2('disable');
              $('#tumblr-wrapper').removeClass('edit-mode');

              //TODO TCT2003
              //these variables should be pulled from divs
              var tumblr_el = '#tumblr-feed-el';
              var hostname = $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-selected-hostname').val();

              var tags = $('#select2-tumblr-tags').select2('val');

              var group = ($('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-selected-group').val() == 'Group by Student UNI') ? true : false;
              
              var limit = 1; //set to maximum always

              if($('#tumblr-feed-el').children().length > 0){//not first time
                refreshTumblrFeed();
              }else{
                var lessionID = this.model.get('nid');

                var tumblrFeed = new TumblrFeed();

                tumblrFeed.set({
                  "field_tumblr_hostname": hostname,
                  "field_tumblr_tags": tags.toString(),
                  "field_tumblr_limit": limit,
                  "field_tumblr_group_by_student": 'false',
                  "field_parent_lesson_nid": lessionID,
                  "type": 'tumblr_feed'
                });

                tumblrFeed.url = "/node";

                tumblrFeed.save({},{
                  success: function(model, response, options){
                    tumblrFeed.id = response.id;
                    tumblrFeed.url = "/node/" + response.id + ".json";
                    tumblrFeed.set({
                      "nid":response.id
                    });
                    tumblrFeed.save();
                  },
                  error: function(model, xhr, options){
                    alert('error saving tumblr feed');
                  }
                });

                initTumblrFeed(tumblr_el, hostname, tags, limit, '');
              }

            }

          },

          initTumblrEditorHallo: function(){

            $('#tumblr-wrapper .tumblr-feed-edit-wrapper .edit').text('Save');
            $('#select2-tumblr-tags').select2({
              tags:["sketch1"],
              tokenSeparators: [",", " "]
            });

            /*
            $("#select2-tumblr-tags").select2({
              query:function(query){
                var data = {results: []};
                //data.results.push({text: query.term});
                query.callback(data);
              }
          });*/


          },

          /* 
           *  Function called when editor choses Tumblr Feed from the Add-ons menu
          */
          addOnTumblr: function(){
            //Step 1
            //Update the lesson's list of addons to include tumblr
            var addons = this.model.get('field_addons');
            if(addons != null){
              if(addons.indexOf('tumblr') < 0){
                addons = addons + ',tumblr';
              }
            }else{
              addons = 'tumblr';
            }
            this.model.set({
              "field_addons": addons
            });

            this.model.save({}, {silent:true});

            var lessonID = this.model.get('nid');
            var tumblr_title = "Tumblr Feed for lesson "+lessonID;

            var t = new TumblrFeed({
              "title": tumblr_title,
              "type": "tumblr_feed",
              "field_parent_lesson_nid":lessonID
            });

            //need to set this explicitly for a node create
            //because the Drupal Backbone module doesn't know
            //when the node is new... must be a better way!
            t.url = "/node";

            $('.tumblr.preloader', '#node-'+lessonID).show();
            var _this = this;

            var resp = t.save({}, {
              success: function(model, response, options){
                $('.tumblr.preloader', '#node-'+lessonID).hide();
                var tumblrFeedSelector = '#node-' + response.id;
                t.id = response.id;
                t.url = "/node/" + response.id + ".json";
                t.set({
                  "nid":response.id
                });
                t.save({}, {
                  success: function(){
                    //_this.renderTumblrFeed();

                    var tv = new TumblrFeedView({
                      model:t
                    });
                    if(tv.render()){
                      $(tumblrFeedSelector).addClass('active');

                      tumblr.groupingOptions = [];
                      tumblr.groupingOptions.push('Group by Student UNI');
                      tumblr.groupingOptions.push('Group by TA');


                      var course_tumblr_blogs_hostnames = course.get('field_tumblr_blogs');
                      var hostnames = [];

                      if(course_tumblr_blogs_hostnames != null){
                        $.each(course_tumblr_blogs_hostnames, function(key, value) {   
                          $('.tumblr-selected-hostname')
                            .append($("<option></option>")
                            .attr("value",value)
                            .text(value));
                        });
                      }

                      $.each(tumblr.groupingOptions, function(key, value) {   
                        $('.tumblr-selected-group')
                          .append($("<option></option>")
                          .attr("value",value)
                          .text(value));
                      });



                      _this.initTumblrEditorHallo();
                    }

                  }
                });           
                /*
                tumblr.tumblrFeedCollection = new TumblrFeedCollection();
                tumblr.tumblrFeedCollection.reset();

                tumblr.TumblrFeedCollectionView = new Drupal.Backbone.Views.CollectionView({
                  collection: tumblr.tumblrFeedCollection,
                  templateSelector: '#tumblr-feed',
                  renderer: 'underscore',
                  el: '#tumblr-feed-list-el',
                  ItemView: TumblrFeedView,
                  itemParent: '.tumblr-feed-list-container'
                });

                tumblr.TumblrFeedCollectionView.render();
                tumblr.TumblrFeedCollectionView.addOne(t);
                */


              },
              error: function(){
                $('.embed.preloader', '#node-'+lessonID).hide();
              }
            });



            //Step 2
            //reset active tab and hide other tabs
            //$('#lesson-addon-nav li.active').removeClass('active');
            //$('.addon.active').removeClass('active');

            //Step 3
            //Append tumblr html infrastructure
            //if( this.appendTumblrAddon() ){
              //Step 4
              //Init edit mode
              //$('#tumblr-wrapper').addClass('edit-mode active');
              //$('.nav-tumblr').addClass('active');
              //$('#tumblr-wrapper .tumblr-feed-edit-wrapper .edit').bind('click', this.editTumblrAddon);
              //this.initTumblrEditorHallo();
            //}

          },

          appendTumblrAddon: function(){
            var navHTML = '<li class="inline nav-tumblr"><h2 class="inline">Tumblr Feed</h2></li>';
            $('#lesson-addon-nav').append( navHTML );
            var tumblr_el_id = "tumblr-feed-el";
            var tumblr_el = "#" + tumblr_el_id;

            var tumblrHTMLarray = [];

            tumblrHTMLarray.push('<div id="tumblr-wrapper" class="addon">');
              tumblrHTMLarray.push('<div class="tumblr-feed-edit-wrapper">');
                tumblrHTMLarray.push('<div class="inner">');
                  tumblrHTMLarray.push('<div class="row-fluid">');
                    tumblrHTMLarray.push('<div class="tumblr-input-title editable span4"></div>');

                    tumblrHTMLarray.push('<div class="edit-tumblr-buttons span5">');
                      tumblrHTMLarray.push('<div class="button edit">Save</div>');
                      tumblrHTMLarray.push('<div class="button delete">Delete</div>');
                    tumblrHTMLarray.push('</div>');
                  tumblrHTMLarray.push('</div>');

                  tumblrHTMLarray.push('<div class="row-fluid">');
                    tumblrHTMLarray.push('<div class="span4"><select class="tumblr-selected-hostname">');
                      for(var i = 0; i < TumblrHostnameOptionsArray.length; i++){
                        tumblrHTMLarray.push('<option>');
                          tumblrHTMLarray.push(TumblrHostnameOptionsArray[i] + '.tumblr.com');
                        tumblrHTMLarray.push('</option>');
                      }
                    tumblrHTMLarray.push('</select></div><!-- /.span4 -->');
                    tumblrHTMLarray.push('<div class="span5">Select the Tumblr blog to pull from</div>');
                  tumblrHTMLarray.push('</div>');

                  tumblrHTMLarray.push('<div class="row-fluid">');
                    tumblrHTMLarray.push('<div class="span4"><div class="tumblr-input-tags editable"></div></div>');
                    tumblrHTMLarray.push('<div class="span5">Enter the tags to sort by separated by a comma</div>');
                  tumblrHTMLarray.push('</div>');


                  tumblrHTMLarray.push('<div class="row-fluid">');
                    tumblrHTMLarray.push('<div class="span4"><select class="tumblr-selected-group">');
                      tumblrHTMLarray.push('<option>Group by Student UNI</option>');
                      tumblrHTMLarray.push('<option>Do not group</option>');
                    tumblrHTMLarray.push('</select></div><!-- /.span4 -->');
                    tumblrHTMLarray.push('<div class="span5">Select grouping option</div>');
                  tumblrHTMLarray.push('</div>');



                tumblrHTMLarray.push('</div>');//.inner
              tumblrHTMLarray.push('</div><!-- .tumblr-feed-edit-wrapper -->');
              tumblrHTMLarray.push('<div class="tumblr-feed-content">');
                tumblrHTMLarray.push('<div id="');
                tumblrHTMLarray.push(tumblr_el_id);
                tumblrHTMLarray.push('"></div>');
              tumblrHTMLarray.push('</div><!-- .tumblr-feed-content -->');
              tumblrHTMLarray.push('<div class="pagination">');
                tumblrHTMLarray.push('<div class="next button">Next</div>');
                tumblrHTMLarray.push('<div class="prev button">Prev</div>');
              tumblrHTMLarray.push('</div><!-- .pagination -->');
            tumblrHTMLarray.push('</div><!-- #tumblr-wrapper -->');

            var tumblrHTML = tumblrHTMLarray.join('');

            //$('#lesson-attachment-content').append( tumblrHTML );

            return true;

          },

          renderTumblrFeed: function( firstAddon ){
            console.log('renderTumblrFeed()');

            var lessonID = this.model.get('nid');

            tumblr.tumblrFeedCollection = new TumblrFeedCollection();

            tumblr.tumblrFeedCollection.reset();


            tumblr.TumblrFeedCollectionView = new Drupal.Backbone.Views.CollectionView({
              collection: tumblr.tumblrFeedCollection,
              templateSelector: '#tumblr-feed',
              renderer: 'underscore',
              el: '#tumblr-feed-list-el',
              ItemView: TumblrFeedView,
              itemParent: '.tumblr-feed-list-container'
            });

            tumblr.TumblrFeedCollectionView.render();

            tumblr.tumblrFeedCollection.fetchQuery({
              "field_parent_lesson_nid": lessonID,
              "type": "tumblr_feed"
            }, {
              success: function(model, response, options){

                $('.preloader.tumblr').hide();

                _.each(tumblr.TumblrFeedCollectionView._itemViews, function(element, index){
                  //element.show();
                  if( isEditor() ){
                    //element.enterEditMode();
                  }

                  var El = '#tumblr-feed-el';
                  var hostname = element.model.get('field_tumblr_hostname');
                  var limit = '20';
                  var tagsString = element.model.get('field_tumblr_tags');
                  var tags = [];

                  if(tagsString != null){    
                    if(tagsString.indexOf(',') >= 0){
                      tags = tagsString.split(',');
                    }else if(tagsString.length >= 0){
                      tags[0] = tagsString;
                    }
                  }

                  $('#select2-tumblr-tags').select2({
                    tags:tags,
                    tokenSeparators: [",", " "]
                  });

                  var grouping = element.model.get('field_tumblr_grouping');

                  initTumblrFeed(El, hostname, tags, limit, grouping);

                  var navHTML = '<li class="inline nav-tumblr"><h2 class="inline">Tumblr Feed</h2></li>';
                  $('#lesson-addon-nav').append( navHTML );

                  $('#lesson-addon-nav .nav-tumblr').bind('click', element.show);

                });
              },
              error: function(){
                $('.preloader.tumblr').hide();
              }
            });
          },

          /*
           * Render the addons in the order added?
          */
          renderAddons: function(){
            console.log('');
            console.log('*********************renderAddons()');


            var addons = this.model.get('field_addons');
            
            if(addons != null){

              var lessonID = this.model.get('nid');
              var firstAddon = true;
                  
              if(addons.indexOf('qanda') >= 0){
                if( this.appendQandA() ){

                  $('.nav-qanda').addClass('active');
                }
                firstAddon = false;
              }

              if(addons.indexOf('tumblr') >= 0){
                this.renderTumblrFeed( firstAddon );
              }else{
                $('.preloader.tumblr').hide();
              }
            }
          }

        });//end LessonOpenView



        var EmbedView = Drupal.Backbone.Views.Base.extend({
          templateSelector: '#bb_embed_template',

          placeholder: {
            field_embed_code: "Paste embed code here"
          },

          //bind vote up and down events to the buttons and tie these to local functions
          events: {
            "click .remove" :  "deleteEmbed"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);//this calls the fetch
          },

          firstEditEmbed: function(){
            var embedID = this.model.get('nid');
            var this_selector = '#node-' + embedID;

            $('.field-embed-edit-code', this_selector).hallo({
              plugins: {
                'halloreundo': {}
              },
              editable: true,
              toolbar: 'halloToolbarFixed',
              placeholder: this.placeholder.field_embed_code
            });

          },

          deleteEmbed: function(){
            //delete the actual model from the database and its view
            this.model.destroy();
            this.remove();

            setState(MODIFIED);
          }

        });

  
        var UploadView = Drupal.Backbone.Views.Base.extend({
          templateSelector: '#bb_upload_template',

          //bind vote up and down events to the buttons and tie these to local functions
          events: {
            "click .remove" :  "deleteUpload"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);//this calls the fetch
          },

          deleteUpload: function(){
            //delete the actual model from the database and its view
            this.model.destroy();
            this.remove();

            //TODO TCT2003 do I need this?
            setState(MODIFIED);
          }

        });



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

        });

        var UpdateView = Drupal.Backbone.Views.Base.extend({
          templateSelector: '#bb_update_template',
          events: {
            "click .edit" : "editUpdate",
            "click .delete": "deleteUpdate",
            "click .cancel": "cancelEdit",
            "click .update": "transitionUpdate"
          },

          placeholder:{
            title: "Add title",
            field_description: "Add text"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);//this calls the fetch 
          },

          transitionUpdate: function(){
            transitionUpdates();
          },

          /*
            Initializes Hallo.js editor for title and body with placeholders
            for the first opening of a lesson
          */
          initHalloEditorsUpdate: function(editmode){
            //launch Hallo.js
            $('.edit-mode .update-title').hallo({
              plugins: {
                'halloreundo': {}
              },
              editable: editmode,
              toolbar: 'halloToolbarFixed',
              placeholder: this.placeholder.title
            });

            $('.edit-mode .update-description').hallo({
              plugins: {
                'halloformat': {},
                'halloimage': {},
                'halloblock': {},
                'hallojustify': {},
                'hallolists': {},
                'hallolink': {},
                'halloreundo': {}
              },
              editable: editmode,
              toolbar: 'halloToolbarFixed',
              placeholder: this.placeholder.field_description
            });    
          },

          disableHalloEditorsUpdate: function(){
            $('.edit-mode .update-title').hallo({
              editable: false
            });

            $('.edit-mode .update-description').hallo({
              editable: false
            }); 

          },

          firstEditUpdate: function(){
            var this_selector = '#node-' + this.model.get('nid');
            setState(FIRST_EDIT_UPDATE);
            //$('#main').addClass('first-edit');
            this.editUpdate();
          },

          editUpdate: function(){
            var this_selector = '#node-' + this.model.get('nid');
            if($('.edit', this_selector).text() == "Edit"){
              $('.edit', this_selector).text('Save');
              $(this_selector).addClass('edit-mode');
              this.initHalloEditorsUpdate(true);
            }else{
              clearState(FIRST_EDIT_UPDATE);
              this.disableHalloEditorsUpdate();
              //$('#main').removeClass('first-edit');
              this.model.set({
                "title": $(this_selector + ' .update-title').text(),
                "field_description": $(this_selector + ' .update-description').html()
              });

              this.model.save();
              this.cancelEdit();
            }
          },


          deleteUpdate: function(){

            UpdatesCollectionView.remove(this.model);
            this.model.destroy();
            this.remove();
          },

          cancelEdit: function(){

            var this_selector = '#node-' + this.model.get('nid');
            if( getState(FIRST_EDIT_UPDATE) ){
              // this.model.save();
              this.deleteUpdate();
            }else{
              $('.edit', this_selector).text('Edit');
              $('.edit-mode').removeClass('edit-mode');
              
              //Revert textarea values to database values (works for save and cancel b/c already saved to local memory)
              $('.update-title', this_selector).text( this.model.get('title') );
              $('.update-description', this_selector).html( this.model.get('field_description') );
            }
          }

        });

        /*
          STEP 4A
          create a collection of lessons that extends the NodeIndex collection
          that comes with the Drupal Backbone module
        */

        var LessonCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Lesson,
          comparator: function(question) {
            return question.get("field_order");//add negative value to sort from greatest to least
          }
        });

        var EmbedCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Embed
        });

        var UploadCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Upload
        });

        var WeekCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Week,
          comparator: function(question) {
            return question.get("field_order");//add negative value to sort from greatest to least
          }
        });

        WeeksCollection = new WeekCollectionPrototype();

        //TODO: for some reason the collection is initializing with one model
        //that is undefined, so reset it immediately to clear it out
        WeeksCollection.reset();

        var UpdateCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Update,
          comparator: function(update) {
            return -update.get("created");//negative value to sort from greatest to least
          }
          
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

        var EmbedCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
          resort: function(opts){
          }
        });

        var UploadCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
          resort: function(opts){
          }
        });

        var WeekCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
          resort: function(opts){
            //this.el.detach();
            this.collection.reset();
            //this.addAll();
          }
        });

        WeeksCollectionView = new WeekCollectionViewPrototype({
          collection: WeeksCollection,
          templateSelector: '#week-list',
          renderer: 'underscore',
          el: '#weeks-list-el',
          ItemView: WeekView,
          itemParent: '.week-list-container'
        });
 

        var _months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        var _days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        var UpdateCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({
          resort: function(opts){
          }
          
          ,
          
          addOne: function(newModel, back){
            //determines if added to front
            back = typeof back !== 'undefined' ? back : false;

            var newItemView = Drupal.Backbone.Views.CollectionView.prototype.addOne.call(this, newModel);
            var this_selector = "#node-" + newItemView.model.get('nid');

            //take the new update and prepend it, rather than putting it at the end
            /*
            if(back == false){
              var tempNode = $(this_selector).detach();
              $('#updates-list-el').prepend(tempNode);
            }
            */
            
            if(newItemView.model.get('created') != undefined){
              //convert the created unix date stamp to a JS Date object and print out user readable date
              var date = new Date( newItemView.model.get('created')*1000 );
            }else{//if it's a new update, set to current time
              var date = new Date();
            }

            //parse date object
            var dateStringArray = [];
            dateStringArray.push('<div class="update-date date">');
            dateStringArray.push( _days[ date.getDay() ] );
            dateStringArray.push(', ');
            dateStringArray.push( _months[ date.getMonth() ] );
            dateStringArray.push(' ');
            dateStringArray.push(date.getDate());
            dateStringArray.push(', ');
            dateStringArray.push(date.getFullYear());
            dateStringArray.push('</div>');
            dateString = dateStringArray.join('');

            $('.inner', this_selector).prepend(dateString);

            return newItemView;
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

        LessonsCollection = [];
        LessonsCollectionView = [];

        //console.log('instantiating EmbedsCollection');
        //var EmbedsCollection;
        //var EmbedsCollectionView;

        /* 
          STEP 7
          Fetch the collection of Question nodes by sending the nid of the tutorial
        */
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

        /*
          STEP 8
          Create an empty question for new question to be asked
        */
        $('#add-week-container').bind('click',function(){

          min_order = 10000;
          _.each(WeeksCollectionView._itemViews, function(view, index, list){

            var order = view.model.get('field_order');
            order = parseInt(order);

            if( order < min_order ){
              min_order = order;
            }
          });

          min_order = parseInt( min_order ) - 1;
          min_order = '' + min_order;

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
          
       
        });

        $('#add-update-container').bind('click',function(){
          transitionUpdates();
          var u = new Update({
            "title": "Title",
            "field_description": "",
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
              $('#node-temp').attr('id', 'node-'+response.id);
              $('#update-preloader').hide();
              var newUpdateView = UpdatesCollectionView.addOne(u, false);
              //var newUpdateView = UpdatesCollectionView.addOne(u);
              newUpdateView.firstEditUpdate();
                
            }
          });
          //this can be asyncronous with the server save, meaning that
          //it can update the display even before the server returns a 
          //response (it doesn't have to be in the success callback)
          
       
        });


        





        



        

        ///////////////////////////////////////////////////////////////
        ////////////////// PAGE  //////////////////////////////////////
        ///////////////////////////////////////////////////////////////

        

        var Page = Drupal.Backbone.Models.Node.extend({
          initialize: function(opts){
            Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
            this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id']);
          }
        });

        var OpenPageView = Drupal.Backbone.Views.Base.extend({
          templateSelector: '#bb_page_template',
          renderer: 'underscore',
          el: "#open-page-el",

          events: {
            "click .edit": "editPage",
            "click .cancel": "cancelEditPage",
            "click .delete": "deletePage"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);//this calls the fetch
          },

          editPage: function(event){
              var pageID = this.model.get('nid');

              if($(event.currentTarget).text() == "Edit"){

                $('#page-content-wrapper').addClass('edit-mode');
                $('.open-page .cancel, .open-page .delete').show();


                if($('.open-page .page-content').attr('contenteditable') == undefined){
                  $('.open-page .page-content').hallo({
                    plugins: {
                      'halloformat': {},
                      'halloheadings': {},
                      'halloblock': {},
                      'hallojustify': {},
                      'hallolists': {},
                      'hallolink': {},
                      'halloreundo': {},
                      'halloimage': {}
                    },
                    editable: true,
                    toolbar: 'halloToolbarFixed',
                    placeholder: 'Add page content here'
                  }); 
                }else{
                  $('.open-page .page-content').hallo({
                    editable: true
                  });
                }

                $(event.currentTarget).text('Save');

              }else{


                if( $('.open-page .page-content').hasClass('isModified')){

                  var content = {};
                  content.value = $('.open-page .page-content').html();
                  content.format = "full_html";

                  this.model.set({
                    "field_page_content": content
                  });

                  var _this = this;

                  this.model.save({},{
                    success: function(){
                      _this.cancelEditPage();
                    },
                    error: function(){
                      alert('Updates did not save, please try again. If this persists, contact site administrator');
                    }
                  });
                }else{
                  this.cancelEditPage();
                }

              }
            

          },

          cancelEditPage: function(){
            $('.open-page .page-content').hallo({
              editable: false
            });


            //if canceled before saved, this will revert to the stored value
            $('.open-page .page-content').html( this.model.get('field_page_content').value );

            $('#page-content-wrapper').removeClass('edit-mode');
            $('.open-page .edit').text('Edit');
            $('.open-page .cancel, .open-page .delete').hide();
          },

          deletePage: function(){
            //delete the actual model from the database and its view
            this.model.destroy();
            this.remove();

            transitionSchedule();
          }

        });//end OpenPageView

        var PageView = Drupal.Backbone.Views.Base.extend({
          templateSelector: '#bb_page_list_template',

          events: {
            "click .page-link": "openPage"
          },

          initialize: function(opts) {
            Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
            this.model.bind('change', this.render, this);//this calls the fetch
          },

          openPage: function(){
            var pageID = this.model.get('nid');


            clearContentArea();

            var contentSectionHTML = '<section id="open-page-'+pageID+'" class="span9 open-page" role="complementary"><div id="open-page-el"></div></div>';
            $('#main').append(contentSectionHTML);

            openPageView = new OpenPageView({
              model: this.model
            });

            openPageView.render();

            return false;
          }

        });//end PageView

       


        var PageCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
          model: Page
        });

        var PageCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend();
            


        PagesCollection = new PageCollectionPrototype();

        PagesCollection.reset();

        PagesCollectionView = new PageCollectionViewPrototype({
          templateSelector: '#page-list',
          collection: PagesCollection,
          el: '#pages-list-el',
          ItemView: PageView,
          itemParent: '.page-list-container',
          renderer: 'underscore'
        });

        PagesCollectionView.render();

        PagesCollection.fetchQuery({
          "field_parent_course_nid":pathArray[2],
          "type":"attached_page"
          }, {
            success: function(model, response, options){
              $('#page-preloader').hide();
              $('.course-link-item').removeClass('hidden');
            },
            error: function(){
              $('#page-preloader').hide();
              $('.course-link-item').removeClass('hidden');
            }
        });




        function cancelPageToCourse(){
          $('#add-page-popup').hide();
          $('#add-link, #add-page').show();

          $('#add-page-popup .new-page-title').hallo({
            editable: false
          }); 
        }

        function savePageToCourse(){
          var title = $('#add-page-popup .new-page-title').text();

          var content = {
            "summary": "",
            "value": "",
            "format": "full_html"
          };

          var p = new Page({
            "title": title,
            "type": "attached_page",
            "field_parent_course_nid":courseNid,
            "field_page_content": content
          });

          p.url = "/node";

          //$('.page.preloader', '#node-'+lessonID).show();

          var resp = p.save({}, {
            success: function(model, response, options){
              //$('.embed.preloader', '#node-'+lessonID).hide();

              p.id = response.id;
              p.url = "/node/" + response.id + ".json";
              p.set({
                "nid":response.id
              });
              p.save();


              var newPageView = PagesCollectionView.addOne(p);
              newPageView.openPage();
              //transitionPage(response.id);

              cancelPageToCourse();
            },
            error: function(){
              //$('.embed.preloader', '#node-'+lessonID).hide();
            }
          });
        }





        function addPageToCourse(){
          $('#add-page-popup').show();
          $('#add-page, #add-link').hide();

          $('#add-page-popup .new-page-title').hallo({
            editable: true,
            placeholder: 'Add page title'
          }); 
        }

        $('#add-page').bind('click', addPageToCourse);
        $('#add-page-popup .save').bind('click', savePageToCourse);
        $('#add-page-popup .cancel').bind('click', cancelPageToCourse);

      

      }//end if course
    }//end behavior attach
  }//end behavior
})(jQuery);
