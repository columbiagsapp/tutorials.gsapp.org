var app = app || {};
var pathArray = window.location.pathname.split('/');
var updates_detached = null;
var openLessonView = null;

var COURSE_SUMMARY_CHAR_LEN = 400;

var WeeksCollection;

var LessonsCollection,
    LessonsCollectionView;

var course,
    courseNid;

var parentLessonView = null;

var EmbedsCollection = [];
var EmbedsCollectionView = [];

var UploadsCollection = [];
var UploadsCollectionView = [];

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
lessonEditHallo.placeholder.number = "##";

(function ($){
  Drupal.behaviors.app = {
    attach: function() {
      function strip(html)
      {
         var tmp = document.createElement("DIV");
         tmp.innerHTML = html;
         return tmp.textContent||tmp.innerText;
      }

      function resortWeekOrder(){
        if($(this).text() == 'Resort'){
          $('.week').addClass('resort-mode');

          $('.week-list-container').sortable();
          $('.week-list-container, .week-list-container li').disableSelection();

          $('#add-week-container').hide();
          $(this).text('Save Order');
        }else{
          $('.week').removeClass('resort-mode');
          $('.week-list-container').sortable("disable");

          $('.week-list-container, .week-list-container li').enableSelection();

          //save out new order
          $('.week-list-container > li').each(function(i){
            console.log('*******each .week-list-container li, number: '+ i);
            var thisNID = $(this).find('.week').attr('id');
            thisNID = thisNID.substr(5);
            var model = WeeksCollection.get( thisNID );
            model.set({
              "field_order": i
            });
            model.save();
          });

          $('#add-week-container').show();
          $(this).text('Resort');
        }

      }

      $('#resort-week-container').bind('click', resortWeekOrder);

      function hsize(b){
          if(b >= 1048576) return (Math.round((b / 1048576) * 100) / 100) + " mb";
          else if(b >= 1024) return (Math.round((b / 1024) * 100) / 100) + " kb";
          else return b + " b";
      }

      function init_fileuploader(){
        console.log('*******init_fileuploader(), with vars:');
        console.log(vars);
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

              console.log('first return, data.result: ');
              console.dir(data.result);

              //TODO TCT2003 add logic for deciding the image type
              var upload_file_type = 'image';
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
        $('#add-link').show();

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
            $('#course-links .remove').bind('click', removeExternalLinkToCourse);
          },
          error: function(){
            alert('Please re-submit your new link');
          }
        });

        cancelExternalLinkToCourse();

      }

      function removeExternalLinkToCourse(){
        var links = course.get("field_links");
        var id = $(this).closest('.course-link-item').attr('id');
        id = id.substr(17);
        id = parseInt(id);

        console.log('links: ');
        console.dir(links);

        console.log('id: '+ id);

        links.splice( id ,1);

        console.log('links post splice ');
        console.dir(links);

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
        $('#add-link').hide();

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
      $('#course-links .remove').bind('click', removeExternalLinkToCourse);
      $('#add-link-popup .save').bind('click', saveExternalLinkToCourse);
      $('#add-link-popup .cancel').bind('click', cancelExternalLinkToCourse);

      function extractBodyProperty(property){
        var bodyClasses = $('body').attr('class');
        var idxStart = bodyClasses.indexOf(property) + property.length;
        var idxEnd = bodyClasses.indexOf(' ', idxStart);
        if(idxEnd >= 0){
          var returnVal = bodyClasses.substring(idxStart, idxEnd);
          console.log('has an end: '+ returnVal);
        }else{
          var returnVal = bodyClasses.substring(idxStart);
          console.log('has NO end: '+ returnVal);
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

      function transitionSyllabus(){
        var contentSectionHTML = 
              '<section id="syllabus" class="span9 outer" role="complementary"><h2 class="heading float-left">Syllabus</h2><div class="edit-button-container"><div id="edit-syllabus-button" class="button">Edit</div><div id="cancel-edit-syllabus-button" class="cancel button">Cancel</div></div><div id="syllabus-content-wrapper" class="brick roman"><div class="inner"><div class="syllabus-content editable">';

        contentSectionHTML = contentSectionHTML + course.get('field_syllabus').value + '</div></div></div></section><!-- /.span3 -->';

        if( $('#lesson-content').length){
          //remove the temporary lesson model and view
          openLessonView.remove();
          openLessonView = null;

          EmbedsCollection.reset();
          EmbedsCollection = null;
          EmbedsCollectionView = null;

          $('.theOpenLesson').removeClass('theOpenLesson');
          $('.selected').removeClass('selected');

          $('#lesson-content').remove();

          //TODO TCT2003 FRI DEC 21, 2012: perhaps animate this?
          $('#main').append(updates_detached);
        }else{
          console.log('detaching updates');
          $('#schedule').removeClass('span9').addClass('span3 collapsed');
          updates_detached = $('#updates').detach();
        }
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


        return false;
      }
      /*
        This function transitions from any state to the main state
        with Schedule in focus and Updates in the sidebar
      */
      function transitionSchedule(){
        if( $('#lesson-content').length){
          //remove the temporary lesson model and view
          openLessonView.remove();
          openLessonView = null;

          EmbedsCollection.reset();
          EmbedsCollection = null;
          EmbedsCollectionView = null;

          $('.theOpenLesson').removeClass('theOpenLesson');
          $('.selected').removeClass('selected');

          $('#lesson-content').remove();

          //TODO TCT2003 FRI DEC 21, 2012: perhaps animate this?
          $('#schedule').removeClass('span3 collapsed').addClass('span9');
          $('#main').append(updates_detached);
        }else if( $('#syllabus').length > 0 ){
          $('#syllabus').remove();
          $('#main').append(updates_detached);
        }
        $('#updates').removeClass('span9').addClass('span3 collapsed');
        $('#schedule').removeClass('span3 collapsed').addClass('span9');

        return false;
      }

      function transitionUpdates(){

        if( $('#lesson-content').length){
          $('#lesson-content').remove();
          $('.open').removeClass('.open');
        }
        if(updates_detached != null){
          $('#main').append(updates_detached);
          updates_detached = null;
        }
        $('#updates').removeClass('span3 collapsed').addClass('span9');
        $('#schedule').removeClass('span9').addClass('span3 collapsed');

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
        console.log('getState() state: '+state);

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
            console.log('no state given to check');
            var state = $('#main').attr('class');
            console.log('state classes: '+state);

            var idxStart = state.indexOf('state-');
            var idxEnd = state.indexOf(' ', idxStart+5);
            if(idxEnd >= 0){
              state = state.substring(idxStart, idxEnd);
            }else{
              state = state.substring(idxStart);
            }
            console.log('final state: '+state);

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
          console.log('clicked #question-submit');

          var userUID = extractBodyProperty('user-uid-');
          console.log('uid: '+userUID);

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

        course.fetch();


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
            console.log('testFunction()');
            console.log('this model nid: '+this.model.get("nid") );
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
              '<section id="lesson-content" class="span9 outer" role="complementary"><h2 class="heading float-left">Lesson</h2><div id="lesson-content-el" class="el"></div></section><!-- /.span3 -->';

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
                $('#schedule').removeClass('span9').addClass('span3 collapsed');
                updates_detached = $('#updates').detach();
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
              openLessonView.initQuestionSubmitHalloEditorsLesson();

              //attach any embeds
              openLessonView.attachEmbed();
              openLessonView.attachUpload();

              //TODO TCT2003 need to attach any uploads

              //attach Q&A
              //TODO TCT2003 perhaps make this a fcn of LessonOpenView?
              attachQuestionAndAnswer(NID);

              //point the global openLessonView to the new LessonOpenView
              //openLessonView = this._openLessonView;

              return true;
            }else{
              return false;
            }

          },

          firstEditLesson: function(){
            console.log('firstEditLesson()');
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
            "click .button-upload-file": "uploadFile"
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
            console.log('LessonOpenView initialize()');
          },

          /*
            Enables Hallo.js editor for title and body
          */
          enableHalloEditorsLesson: function(){
            $('.lesson-open .lesson-title').hallo({
              editable: true
            });

            $('.lesson-open .lesson-description').hallo({
              editable: true
            });

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

            $('.lesson-open .lesson-description').hallo({
              editable: false
            });

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
            //launch Hallo.js
            $('.lesson-open .lesson-title').hallo({
              plugins: {
                'halloreundo': {}
              },
              editable: editmode,
              toolbar: 'halloToolbarFixed',
              placeholder: this.placeholder.title
            });


       

            $('.lesson-open .lesson-description').hallo({
              plugins: {
                'halloformat': {},
                'halloblock': {},
                'hallojustify': {},
                'hallolists': {},
                'hallolink': {},
                'halloreundo': {},
                'halloimage': {}
              },
              editable: editmode,
              toolbar: 'halloToolbarFixed',
              placeholder: this.placeholder.field_description
            });    

            //$('body #main').append('<div class="field-type-file field-name-field-assignment-attachment field-widget-file-generic form-wrapper" id="edit-field-assignment-attachment"><div id="edit-field-assignment-attachment-und-0-ajax-wrapper"><div class="form-item form-type-managed-file form-item-field-assignment-attachment-und-0"><label for="edit-field-assignment-attachment-und-0">Assignment Attachment </label><div class="file-widget form-managed-file clearfix"><input type="file" id="edit-field-assignment-attachment-und-0-upload" name="files[field_assignment_attachment_und_0]" size="22" class="form-file" /><input type="submit" id="edit-field-assignment-attachment-und-0-upload-button" name="field_assignment_attachment_und_0_upload_button" value="Upload" class="form-submit" /><input type="hidden" name="field_assignment_attachment[und][0][fid]" value="0" /><input type="hidden" name="field_assignment_attachment[und][0][display]" value="1" /></div><div class="description">A PDF of the assignment<br />Files must be less than <strong>5 MB</strong>.<br />Allowed file types: <strong>txt pdf doc</strong>.</div></div></div>');
          },

          initQuestionSubmitHalloEditorsLesson: function(){
            console.log('----initQuestionSubmitHalloEditorsLesson()');

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
              placeholder: this.placeholder.title
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
              placeholder: this.placeholder.field_question_submit
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


            console.log('saveUploads() with result: ');
            console.dir(data);

            var thisLessonOpenView = this;

            var lessonID = this.model.get('nid');
            var uploadsArray = [];//returned to Lesson to be stored in field_uploads[]

            //if the open lesson already has uploads, and therefore an UploadsCollectionView
            if(UploadsCollectionView._itemViews.length > 0){
              console.log('UploadsCollection.length > 0');

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
                      //remove preloader for lesson for this particular week based on weekID
                      //$('.embed.preloader', '#open-node-'+lessonID).remove();

                      console.log('upload save success');
                      console.log('re-initializing Uploads collection stuff');

                      thisLessonOpenView.initUploadsCollectionAndView(lessonID);
                      thisLessonOpenView.attachUpload();

                    },
                    error: function(model, xhr, options){
                      //remove preloader for lesson for this particular week based on weekID
                      //$('.embed.preloader', '#open-node-'+lessonID).remove();

                      console.log('upload save error');
                      console.log('re-initializing Uploads collection stuff');

                      thisLessonOpenView.initUploadsCollectionAndView(lessonID);
                      thisLessonOpenView.attachUpload();
                    }
                  });

                }else{
                  uploadView.model.save();
                }

                  
              }//end for
            }else{
              console.log('re-initializing Uploads collection stuff');
              thisLessonOpenView.initUploadsCollectionAndView(lessonID);
              thisLessonOpenView.attachUpload();
            }

            clearState(FIRST_EDIT_UPLOAD);

            return uploadsArray.join(',');
          },

          saveEmbeds: function(){
            console.log('saveEmbeds()');

            var thisLessonOpenView = this;

            var lessonID = this.model.get('nid');
            var embedsArray = [];

            if(EmbedsCollectionView._itemViews.length > 0){
              console.log('EmbedsCollection.length > 0');

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
                if( (i == (ECV_iVLength - 1)) && ( getState(FIRST_EDIT_LESSON) || getState(FIRST_EDIT_EMBED) || getState(MODIFIED) ) ){
                  embedView.model.save({},{
                    
                    success: function(model, response, options){
                      //remove preloader for lesson for this particular week based on weekID
                      //$('.embed.preloader', '#open-node-'+lessonID).remove();

                      console.log('embed save success');
                      console.log('re-initializing Embeds collection stuff');

                      thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
                      thisLessonOpenView.attachEmbed();

                    },
                    error: function(model, xhr, options){
                      //remove preloader for lesson for this particular week based on weekID
                      //$('.embed.preloader', '#open-node-'+lessonID).remove();

                      console.log('embed save error');
                      console.log('re-initializing Embeds collection stuff');

                      thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
                      thisLessonOpenView.attachEmbed();
                    }
                  });

                }else{
                  embedView.model.save();
                }

                  
              }//end for
            }else{
              console.log('re-initializing Embeds collection stuff');
              thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
              thisLessonOpenView.attachEmbed();
            }

            clearState(FIRST_EDIT_EMBED);
            clearState(MODIFIED);

            return embedsArray.join(',');
          },

          attachUpload: function(){

            var lessonID = this.model.get("nid");

            console.log('attachUpload() for lesson: '+lessonID);

            //this.initEmbedsCollectionAndView(lessonID);

            //TODO TCT2003 WED DEC 19, 2012 need to figure out how to get the week nid dynamically?
            UploadsCollection.fetchQuery({
              "field_parent_lesson_nid":lessonID,
              "type":"upload"
            }, {
              success: function(model, response, options){
                //remove preloader for lesson for this particular week based on weekID
                $('.upload.preloader', '#open-node-'+lessonID).remove();
                $('.attachments-header').removeClass('hidden');

                console.log('upload fetch success');

                //TODO TCT2003 add "remove" button
              },
              error: function(model, xhr, options){
                //remove preloader for lesson for this particular week based on weekID
                $('.upload.preloader', '#open-node-'+lessonID).remove();

                console.log('upload fetch error');
              }

            });
          },

          attachEmbed: function(){

            var lessonID = this.model.get("nid");

            console.log('attachEmbed() for lesson: '+lessonID);

            //this.initEmbedsCollectionAndView(lessonID);

            //TODO TCT2003 WED DEC 19, 2012 need to figure out how to get the week nid dynamically?
            EmbedsCollection.fetchQuery({
              "field_parent_lesson_nid":lessonID,
              "type":"embed"
            }, {
              success: function(model, response, options){
                //remove preloader for lesson for this particular week based on weekID
                $('.embed.preloader', '#open-node-'+lessonID).remove();

                console.log('embed fetch success');

                $('.lesson-embed-element', '#open-node-'+lessonID).each(function(){
                  $('.field-embed-edit-code', this).text( $('.field-embed-content-wrapper', this).html() );

                  $('.field-embed-edit-code', this).hallo({
                    plugins: {
                      'halloreundo': {}
                    },
                    editable: true,
                    toolbar: 'halloToolbarFixed',
                    placeholder: 'Paste code asaaaa'
                  });
                });
              },
              error: function(model, xhr, options){
                //remove preloader for lesson for this particular week based on weekID
                $('.embed.preloader', '#open-node-'+lessonID).remove();

                console.log('embed fetch error');
              }

            });
          },

          editLesson: function(){
            var this_selector = '#open-node-' + this.model.get('nid');
            
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
              //var uploads = this.saveUploads();//only call on init_fileuploader:completed()

              //TODO TCT2003 add this.saveUploads();

              if(description_summary.length > 180){
                description_summary = description_summary.substr(0,180) + '...';
              }

              console.log("saving description_summary: "+description_summary);

              this.model.set({
                "title": theTitle,
                "field_description": description,
                "field_description_summary": description_summary,
                "field_embeds": embeds
              });

              var thisLessonOpenView = this;

              this.model.save({},{
                success: function(){//TODO TCT2003 why do I have to refetch these?
                  //thisLessonOpenView.attachEmbed();
                  //thisLessonOpenView.attachUpload();
                }
              });

              if(getState(FIRST_EDIT_LESSON)){
                clearState(FIRST_EDIT_LESSON);
                this.initQuestionSubmitHalloEditorsLesson();
              }

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
            var this_selector = '#open-node-' + this.model.get('nid');
            //disable Hallo.js editors
            this.disableHalloEditorsLesson();

            if( getState(FIRST_EDIT_LESSON) ){
              clearState(FIRST_EDIT_LESSON);
              //TODO TCT2003 do I need to save the model first?
              this.model.save();
              this.deleteLesson();
            }else{
              $('.edit', this_selector).text('Edit');
              $(this_selector).removeClass('edit-mode');

              
              //TODO SOON TCT2003 
              //Revert textarea values to database values (works for save and cancel b/c already saved to local memory)
              //$('textarea.lesson-title', this_selector).val( this.model.get('title') );
              //$('textarea.lesson-description', this_selector).val( this.model.get('field_description') );

              //so it doesn't show up in the collapsed week list when you click save for the first time on a new lesson
              
              $('.selected .lesson').each(function(){
                if($(this).attr('id') == this_selector){
                  $(this).addClass('theOpenLesson');
                }
              });
            }
          },

          addUpload: function(result, uploadType){
            var thisLessonOpenView = this;
            var courseID = $('.course').attr('id');
            courseID = courseID.substring(5);

            console.log('Course: '+courseID);

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

            console.log('***result passed to addUpload():');
            console.dir(result);

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
                
                console.log('*****adding new upload to UploadsCollectionView');

                setState(FIRST_EDIT_UPLOAD);


                //thisLessonOpenView.saveUploads(f);


                var newUploadView = UploadsCollectionView.addOne(f);

                var uploads = [];

                //loop through each upload in UploadsCollection and push it's type into uploads[]
                _.each(UploadsCollection.models, function(element, index, list){
                  console.dir(element);
                  uploads.push( element.get('field_upload_type') );
                });

                uploads = uploads.join(',');

                thisLessonOpenView.model.set({
                  "field_uploads": uploads
                });

                thisLessonOpenView.model.save({}, {
                  success: function(){
                    console.log('saved file type into lesson');
                    $('.attachments-header').removeClass('hidden');
                    $('#fileupload-modal').modal('hide');

                  }
                });
                  
                //thisLessonOpenView.initUploadsCollectionAndView(lessonID);
        //        thisLessonOpenView.attachUpload();
                     
              }
            });
          },//end addUpload()

          addEmbed: function(embedType){
            var thisLessonOpenView = this;
            var courseID = $('.course').attr('id');
            courseID = courseID.substring(5);

            console.log('Course: '+courseID);

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

            var resp = e.save({}, {
              success: function(model, response, options){
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
                
                console.log('*****adding new embed to EmbedsCollection');

                setState(FIRST_EDIT_EMBED);

                //if EmbedsCollection is empty, need to re-initialize
                if(EmbedsCollection.length == 0){
                  thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
                  thisLessonOpenView.attachEmbed();
                }else{
                  var newEmbedView = EmbedsCollectionView.addOne(e);
                  newEmbedView.firstEditEmbed();
                }
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

          uploadFile: function(){
            console.log('*****   called uploadFile()');

            //setState(FIRST_EDIT_UPLOAD);//put it in addUpload()

            init_fileuploader();
            $('#fileupload-modal').modal('show');
            return false;

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
            console.log('firstEditEmbed()');
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
            console.log('delete upload');
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

            console.log('addLesson() called by week : '+ weekID);

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
              $('.lesson-list-container > li', this_selector).each(function(i){
                console.log('*******each .lesson-list-container li, number: '+ i);
                var thisNID = $(this).find('.lesson').attr('id');
                thisNID = thisNID.substr(5);
                var weekID = this_selector.substr(6);
                console.log('weekID: '+ weekID);
                console.log('thisNID: '+ thisNID);
                var model = LessonsCollection[weekID].get( thisNID );
                model.set({
                  "field_order": i
                });
                model.save();
              });

            }else{//cancel clicked
              $('.lesson-list-container', this_selector).sortable('cancel');
            }
            $('.lesson-list-container', this_selector).sortable('disable');
            $('.lesson-list-container, .lesson-list-container li', this_selector).enableSelection();
          },

          firstEditWeek: function(){
            var this_selector = '#node-' + this.model.get('nid');
            $('.lesson.preloader', this_selector).remove();

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
                placeholder: lessonEditHallo.placeholder.number
              });

              $('.week .week-title').hallo({
                plugins: {
                  'halloreundo': {}
                },
                editable: true,
                toolbar: 'halloToolbarFixed',
                placeholder: lessonEditHallo.placeholder.title
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
              var weekNumber = $('.week-number', this_selector).text();
              //add preceding 0 to single digit week, and remove trailing digits/whitespace past 2 chars
              if( weekNumber.length == 1){
                weekNumber = '0' + weekNumber;
              }else if(weekNumber.length > 2){
                weekNumber = weekNumber.substr(0,2);
              }
              
              this.model.set({
                "title": $(this_selector + ' .week-title').text(),
                "field_week_number": weekNumber,
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
            console.log('firstEditUpdate()');
            var this_selector = '#node-' + this.model.get('nid');
            console.log('this_selector: '+this_selector);
            setState(FIRST_EDIT_UPDATE);
            //$('#main').addClass('first-edit');
            this.editUpdate();
          },

          editUpdate: function(){
            console.log('editUpdate()');

            var this_selector = '#node-' + this.model.get('nid');
            if($('.edit', this_selector).text() == "Edit"){
              console.log('clicked edit');
              $('.edit', this_selector).text('Save');
              $(this_selector).addClass('edit-mode');
              this.initHalloEditorsUpdate(true);
            }else{
              console.log('clicked save');
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
            console.log('deleteUpdate()');

            UpdatesCollectionView.remove(this.model);
            this.model.destroy();
            this.remove();
          },

          cancelEdit: function(){
            console.log('cancelUpdate()');

            var this_selector = '#node-' + this.model.get('nid');
            if( getState(FIRST_EDIT_UPDATE) ){
              console.log('first edit - therefore delete');
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

            console.log('addOne(), created: '+newItemView.model.get('created'));
            
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
              $('#week-preloader').remove();
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
                      $('.lesson.preloader', '#node-'+weekID).remove();
                      $('.open', '#node-'+weekID).removeClass('theOpenLesson');
                      $('.lesson-list-container', '#node-'+weekID).sortable();
                      $('.lesson-list-container', '#node-'+weekID).sortable('disable');
                    },
                    error: function(model, xhr, options){
                      //remove preloader for lesson for this particular week based on weekID
                      $('.lesson.preloader', '#node-'+weekID).remove();
                      $('.lesson.open', '#node-'+weekID).removeClass('theOpenLesson');
                    }

                  });

                }
              });
            },
            error: function(){
              $('#week-preloader').remove();
            }
        });

        UpdatesCollection.fetchQuery({
          "field_parent_course_nid":pathArray[2],
          "type":"update"
          }, {
            success: function(model, response, options){
              $('#update-preloader').remove();
            }, 
            error: function(){
              $('#update-preloader').remove();
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
          
          $('.week-list-container').append('<div id="week-preloader" class="week brick roman preloader edit-mode"></div>');
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
              $('#week-preloader').remove();
              var newWeekView = WeeksCollectionView.addOne(w);
              newWeekView.firstEditWeek();
            }
          });
          
       
        });

        $('#add-update-container').bind('click',function(){
          transitionUpdates();
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
              $('#node-temp').attr('id', 'node-'+response.id);
              $('#update-preloader').remove();
              var newUpdateView = UpdatesCollectionView.addOne(u, false);
              //var newUpdateView = UpdatesCollectionView.addOne(u);
              newUpdateView.firstEditUpdate();
                
            }
          });
          //this can be asyncronous with the server save, meaning that
          //it can update the display even before the server returns a 
          //response (it doesn't have to be in the success callback)
          
       
        });

      }//end if course
    }//end behavior attach
  }//end behavior
})(jQuery);
