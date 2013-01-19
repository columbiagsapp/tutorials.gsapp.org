(function ($){
	Drupal.behaviors.app = {
    	attach: function() {

var Update = Drupal.Backbone.Models.Node.extend({
  initialize: function(opts){
    Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
    this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id' ]);
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

});//end UpdateView

///////////////////////////////////////////////////////////////
////////////////// UPDATE COLLECTIONS /////////////////////////
///////////////////////////////////////////////////////////////

var UpdateCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
  model: Update,
  comparator: function(update) {
    return -update.get("created");//negative value to sort from greatest to least
  }  
});

///////////////////////////////////////////////////////////////
////////////////// UPDATE COLLECTION VIEWS ////////////////////
///////////////////////////////////////////////////////////////

var UpdateCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend({          
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


///////////////////////////////////////////////////////////////
////////////////// UPDATE FUNCTIONS ///////////////////////////
///////////////////////////////////////////////////////////////


function clickAddUpdate(){
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
}
		}//end attach
	}//end behav
})(jQuery);
