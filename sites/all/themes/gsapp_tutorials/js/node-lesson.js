(function ($){
	Drupal.behaviors.app = {
    	attach: function() {

///////////////////////////////////////////////////////////////
////////////////// LESSON MODEL ///////////////////////////////
///////////////////////////////////////////////////////////////

var Lesson = Drupal.Backbone.Models.Node.extend({
  initialize: function(opts){
    Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
    //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
    //needed to take out a bunch when using REST WS - last_view seems to be the culprit
    this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id']);
  }
});

///////////////////////////////////////////////////////////////
////////////////// LESSON VIEWS ///////////////////////////////
///////////////////////////////////////////////////////////////

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
        $('#schedule').removeClass('span9').addClass('span3 collapsed');
        updates_detached = $('#updates').detach();
        $('#syllabus').remove();
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

      console.log( 'should call initHalloEditorLesson()-------' );

      openLessonView.initHalloEditorLesson(false);

      //attach any embeds
      openLessonView.attachEmbed();
      openLessonView.attachUpload();

      openLessonView.attachAddons();

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

    "click .button-upload-image": "uploadImageFile",
    "click .button-upload-pdf": "uploadPDFFile",
    "click .button-upload-code": "uploadCodeFile",
    "click .button-upload-file": "uploadFileFile",
    "click .button-addon-tumblr": "addOnTumblr",
    "click .button-addon-qanda": "addOnQandA"
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
    console.log('LessonOpenView initialize()');
  },

  /*
    Enables Hallo.js editor for title and body
  */
  enableHalloEditorsLesson: function(){
    this.initHalloEditorLesson(true);

    $('.lesson-open .lesson-embed-element').each(function(){
      console.log('trying to enable hallo.js for embed code ****');
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
    console.log( '-------initHalloEditorLesson()-------' );
    //launch Hallo.js
    $('.lesson-open .lesson-title').hallo({
      plugins: {
        'halloreundo': {}
      },
      editable: editmode,
      toolbar: 'halloToolbarFixed',
      placeholder: 'Optional subtitle'
    });

    $('.lesson-open .lesson-description').hallo({
      plugins: {
        'halloformat': {},
        'hallolists': {},
        'hallojustify': {},
        'hallolink': {},
        'halloreundo': {}
      },
      editable: editmode,
      toolbar: 'halloToolbarFixed',
      placeholder: 'Add description'
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

              console.log('upload save success');
              console.log('re-initializing Uploads collection stuff');

              thisLessonOpenView.initUploadsCollectionAndView(lessonID);
              thisLessonOpenView.attachUpload();

            },
            error: function(model, xhr, options){

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

              console.log('embed save success');
              thisLessonOpenView.initEmbedsCollectionAndView(lessonID);
              thisLessonOpenView.attachEmbed();

            },
            error: function(model, xhr, options){

              console.log('embed save error');
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

    return embedsArray.join(',');
  },

  attachUpload: function(){

    console.log('attachUpload()');

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
        $('.upload.preloader', '#open-node-'+lessonID).hide();
        $('.attachments-header').removeClass('hidden');

        console.log('upload fetch success');

        //TODO TCT2003 add "remove" button
      },
      error: function(model, xhr, options){
        //remove preloader for lesson for this particular week based on weekID
        $('.upload.preloader', '#open-node-'+lessonID).hide();

        console.log('upload fetch error');
      }

    });
  },

  attachEmbed: function(){

    console.log('attachEmbed()');

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
        $('.embed.preloader', '#open-node-'+lessonID).hide();

        console.log('embed fetch success');

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

        console.log('embed fetch error');
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
          console.log('----save lesson error');
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

    console.log('deleteLesson()');

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

    console.log('cancelEdit()');

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
        
        console.log('*****adding new upload to UploadsCollectionView');

        setState(FIRST_EDIT_UPLOAD);


        //thisLessonOpenView.saveUploads(f);


        var newUploadView = UploadsCollectionView.addOne(f);

        var uploads = [];

        console.log('about to loop through UploadsCollection');
        //loop through each upload in UploadsCollection and push it's type into uploads[]
        _.each(UploadsCollection.models, function(element, index, list){

          console.log('looping through UploadsCollection');
          
          var type = element.get('field_upload_type');
          if($.inArray(type, uploads) < 0){
            console.log(type+ ' is not in uploads array&&&&&&&&&&&&&&&&&&&&&');
            uploads.push( element.get('field_upload_type') );
          }else{
            console.log(type+ ' is in uploads array, but still adding&&&&&&&&&&&&&&&&&&&&&');
            uploads.push( element.get('field_upload_type') );
          }
        });

        uploads = uploads.join(',');

        thisLessonOpenView.model.set({
          "field_uploads": uploads
        }, {silent: true});

        console.log('JUST SET LESSON VIEW MODEL WITH UPLOADS');

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
        
        console.log('*****adding new embed to EmbedsCollection');

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
    console.log('addOnQandA');

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

      $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-input-title').hallo({
        editable: false,
        placeholder: 'title'
      });
      $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-input-hostname').hallo({
        editable: false,
        placeholder: 'sitename'
      });
      $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-input-tags').hallo({
        editable: false,
        placeholder: 'tag1, tag2, tag3'
      });

      $('#tumblr-wrapper').removeClass('edit-mode');

      //TODO TCT2003
      //these variables should be pulled from divs
      var tumblr_el = '#tumblr-feed-el';
      var hostname = $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-input-hostname').text() + '.tumblr.com';
      var tagStr = $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-input-tags').text();
      console.log('tagStr: '+ tagStr);

      var tags = tagStr.split(', ');
      var limit = 1; //set to maximum always

      console.log('calling initTumblrFeed() with hostname: '+ hostname + ', ' + 'tags: ');
      console.dir(tags);


      if($('#tumblr-feed-el').children().length > 0){//not first time
        refreshTumblrFeed();
      }else{
        var lessionID = this.model.get('nid');

        var tumblrFeed = new TumblrFeed();

        tumblrFeed.set({
          "field_tumblr_hostname": hostname,
          "field_tumblr_tags": tagStr,
          "field_tumblr_limit": limit,
          "field_tumblr_group_by_student": 'false',
          "field_parent_lesson_nid": lessionID,
          "type": 'tumblr_feed'
        });

        tumblrFeed.url = "/node";

        
        

        tumblrFeed.save({},{
          success: function(model, response, options){
            console.log('saved new tumblr_feed');

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

        initTumblrFeed(tumblr_el, hostname, tags, limit);
      }

    }

  },

  initTumblrEditorHallo: function(){
    $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-input-title').hallo({
      editable: true,
      placeholder: 'title'
    });
    $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-input-hostname').hallo({
      editable: true,
      placeholder: 'sitename'
    });
    $('#tumblr-wrapper .tumblr-feed-edit-wrapper .tumblr-input-tags').hallo({
      editable: true,
      placeholder: 'tag1, tag2, tag3'
    });
  },

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

    //Step 2
    //reset active tab and hide other tabs
    $('#lesson-addon-nav li.active').removeClass('active');
    $('.addon.active').removeClass('active');

    //Step 3
    //Append tumblr html infrastructure
    if( this.appendTumblrAddon() ){
      //Step 4
      //Init edit mode
      $('#tumblr-wrapper').addClass('edit-mode active');
      $('.nav-tumblr').addClass('active');
      $('#tumblr-wrapper .tumblr-feed-edit-wrapper .edit').bind('click', this.editTumblrAddon);
      this.initTumblrEditorHallo();
    }

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
          tumblrHTMLarray.push('<div class="edit-tumblr-buttons">');
            tumblrHTMLarray.push('<div class="button edit">Save</div>');
            tumblrHTMLarray.push('<div class="button delete">Delete</div>');
          tumblrHTMLarray.push('</div>');

          tumblrHTMLarray.push('<div class="tumblr-input-title editable"></div>');
          tumblrHTMLarray.push('<div>Hostname:&nbsp;<span class="tumblr-input-hostname editable"></span>&nbsp;.tumblr.com</div>');
          tumblrHTMLarray.push('<div>Tags (separated by commas):&nbsp;<span class="tumblr-input-tags editable"></span></div>');
          tumblrHTMLarray.push('<div class="btn-group" data-toggle="buttons-checkbox">');
            tumblrHTMLarray.push('<button type="button" class="btn btn-primary tumblr-input-group">Click to group by student name</button>');
          tumblrHTMLarray.push('</div>');
        tumblrHTMLarray.push('</div>');
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

    $('#lesson-attachment-content').append( tumblrHTML );

    return true;

  },

  /*
   * Render the addons in the order added?
  */
  attachAddons: function(){
    console.log('');
    console.log('*********************attachAddons()');


    var addons = this.model.get('field_addons');
    if(addons != null){
      console.log('addons =! null');

      var lessonID = this.model.get('nid');
      var addonsArray = [];
      addonsArray = addons.split(',');

      //TODO TCT2003 SOON! instead of _each, just do .indexOf for addons
      //in the order you want them to appear (eg. start with Q&A??)

      var removeAddon = false;
      var removeAddonArray = [];

      removeAddonArray.push('<div class="btn-group button-group-text float-right">');
        removeAddonArray.push('<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">');
          removeAddonArray.push('<i class="icon-plus"></i>&nbsp;&nbsp;Add-on');
          removeAddonArray.push('<span class="caret"></span>');
        removeAddonArray.push('</a>');
        removeAddonArray.push('<ul class="dropdown-menu">');
          

      if(addons.indexOf('qanda') >= 0){
        if( this.appendQandA() ){

          $('.nav-qanda').addClass('active');
        }
        removeAddon = true;
        removeAddonArray.push('<li><a tabindex="-1" href="#" class="button-addon-qanda-remove"><i class="icon-question-sign"></i>&nbsp;&nbsp;Q&amp;A</a></li>');
      }

      if(addons.indexOf('tumblr') > 0){
        var TumblrFeedCollection = Drupal.Backbone.Collections.RestWS.EntityIndex.extend({
          model: TumblrFeed
        });

        var tumblrFeedCollection = new TumblrFeedCollection();

        tumblrFeedCollection.fetch({
          "field_parent_lesson_nid": lessonID,
          "type": "tumblr_feed"
        });

        _.each(tumblrFeedCollection.models, function(model, index){
          console.log('************* model at index: '+ index);
        });

        removeAddon = true;
        removeAddonArray.push('<li><a tabindex="-1" href="#lesson-open-anchor" class="button-addon-tumblr-remove"><i class="icon-rss"></i>&nbsp;&nbsp;Tumblr Feed</a></li>');
      }

      if(removeAddon){
          removeAddonArray.push('</ul>');
        removeAddonArray.push('</div>');
        var removeAddonHTML = removeAddonArray.join('');

        $('#lesson-attachment').prepend( )

      }else{
        removeAddonArray.length = 0;
      }
    }

  }

});//end LessonOpenView

///////////////////////////////////////////////////////////////
////////////////// LESSON COLLECTIONS /////////////////////////
///////////////////////////////////////////////////////////////

var LessonCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
  model: Lesson,
  comparator: function(question) {
    return question.get("field_order");//add negative value to sort from greatest to least
  }
});

///////////////////////////////////////////////////////////////
////////////////// LESSON COLLECTION VIEWS ////////////////////
///////////////////////////////////////////////////////////////

var LessonCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend();
		}//end attach
	}//end behav
})(jQuery);
