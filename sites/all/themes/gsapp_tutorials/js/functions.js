define(['jquery', 'underscore-min', 'backbone-min'],
    function($, _, Backbone) {

///////////////////////////////////////////////////////////////
////////////////// HELPERS FUNCTIONS //////////////////////////
///////////////////////////////////////////////////////////////

//strips HTML and returns plain text
function strip(html)
{
  var tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent||tmp.innerText;
}

///////////////////////////////////////////////////////////////
////////////////// STATE HELPERS //////////////////////////////
///////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////
////////////////// HALLO HELPERS //////////////////////////////
///////////////////////////////////////////////////////////////

//Hallo.js seems to apply min-width and min-height to 
//the editable fields, and I need to strip this out
function refreshHalloFieldStyles(){
	$('.week-header-top').css('minWidth', '');
}

///////////////////////////////////////////////////////////////
////////////////// WEEK HELPERS ///////////////////////////////
///////////////////////////////////////////////////////////////

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
	    console.log('*******each .week-list-container li, number: '+ i);
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

///////////////////////////////////////////////////////////////
////////////////// FILE UPLOAD HELPERS ////////////////////////
///////////////////////////////////////////////////////////////


function hsize(b){
          if(b >= 1048576) return (Math.round((b / 1048576) * 100) / 100) + " mb";
          else if(b >= 1024) return (Math.round((b / 1024) * 100) / 100) + " kb";
          else return b + " b";
      }

      function init_fileuploader(type){
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


///////////////////////////////////////////////////////////////
////////////////// COURSE  HELPERS ////////////////////////
///////////////////////////////////////////////////////////////

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



///////////////////////////////////////////////////////////////
////////////////// TRANSITION HELPERS ////////////////////////
///////////////////////////////////////////////////////////////



function transitionSyllabus(){
        var contentSectionHTML = 
              '<section id="syllabus" class="span9" role="complementary"><div class="float-left heading-button roman"><h2 class="heading float-left">Syllabus</h2><div class="edit-button-container"><div id="edit-syllabus-button" class="button">Edit</div><div id="cancel-edit-syllabus-button" class="cancel button">Cancel</div></div></div><div id="syllabus-content-wrapper" class="brick roman"><div class="inner"><div class="syllabus-content editable">';

        contentSectionHTML = contentSectionHTML + course.get('field_syllabus').value + '</div></div></div></section><!-- /.span3 -->';

        if( $('#lesson-content').length){
          console.log('#lesson-content transition');
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
          //$('#main').append(updates_detached);
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



///////////////////////////////////////////////////////////////
////////////////// Q&A HELPERS ///////////////////////////////
///////////////////////////////////////////////////////////////



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

function clickQuestionSubmit(){
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
        }













/* DELETE ME */
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



      function editPage(){
        var pageID = $(this).closest('.open-page').attr('id');
        pageID = pageID.substr(10);

        console.log('editPage() ********** pageID: '+ pageID);

        if($(this).text() == "Edit"){

          $('#page-content-wrapper').addClass('edit-mode');
          $('#cancel-edit-page-button').show();

          $('.open-page .page-content').hallo({
            editable: true
          }); 

          $(this).text('Save');

        }else{

          if( $('.open-page .page-content').hasClass('isModified')){
            var value = $('.open-page .page-content').html();
            var pages = course.get('field_course_pages');

            pages[pageID].value = value;

            course.set({
              "field_course_pages": pages
            });

            course.save();
          }

          $('.open-page .page-content').hallo({
            editable: false
          }); 

          $('#page-content-wrapper').removeClass('edit-mode');
          $('#cancel-edit-page-button').hide();
          $(this).text('Edit');

        }
      }

      function transitionPage( pageID ){
        console.log('transitionPage, with pageID: '+ pageID);
        console.dir(pageID);
        
        
        var titleArray = course.get('field_course_pages');
        var title = titleArray[pageID].summary;

        var contentSectionHTML = 
              '<section id="open-page-'+pageID+'" class="span9 open-page" role="complementary"><div class="float-left heading-button roman"><div class="heading float-left">'+ title +'</div><div class="edit-button-container"><div id="edit-page-button" class="button float-right">Edit</div><div id="cancel-edit-page-button" class="cancel button">Cancel</div></div></div><div id="page-content-wrapper" class="brick roman"><div class="inner"><div class="page-content editable">';

        contentSectionHTML = contentSectionHTML + course.get('field_course_pages')[pageID].value + '</div></div></div></section><!-- /.span3 -->';

        if( $('#lesson-content').length){
          console.log('#lesson-content transition');
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
          //$('#main').append(updates_detached);
        }else{
          console.log('detaching updates');
          $('#schedule').removeClass('span9').addClass('span3 collapsed');
          updates_detached = $('#updates').detach();
        }
        $('#main').append(contentSectionHTML);


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
          editable: false,
          toolbar: 'halloToolbarFixed',
          placeholder: 'Add page content here'
        }); 


        $('#edit-page-button').bind('click', editPage);


        return false;
      }

      $('.course-page-item').each(function(i){
        $(this).bind('click', function(event){ transitionPage(i); });
      });
