(function ($){
	Drupal.behaviors.app = {
    	attach: function() {

///////////////////////////////////////////////////////////////
////////////////// PAGE MODEL ///////////////////////////////
///////////////////////////////////////////////////////////////

var Page = Drupal.Backbone.Models.Node.extend({
  initialize: function(opts){
    Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
    this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id']);
  }
});

///////////////////////////////////////////////////////////////
////////////////// PAGE VIEWS ///////////////////////////////
///////////////////////////////////////////////////////////////

var PageListView = Drupal.Backbone.Views.Base.extend({
  templateSelector: '#bb_page_list_template',

  initialize: function(opts) {
    Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
    this.model.bind('change', this.render, this);//this calls the fetch
  }

});//end UploadView

var PageView = Drupal.Backbone.Views.Base.extend({
  templateSelector: '#bb_page_template',

  //bind vote up and down events to the buttons and tie these to local functions
  events: {
    "click .delete" :  "deletePage"
  },

  initialize: function(opts) {
    Drupal.Backbone.Views.Base.prototype.initialize.call(this, opts);
    this.model.bind('change', this.render, this);//this calls the fetch
  },

  deletePage: function(){
    console.log('delete upload');
    //delete the actual model from the database and its view
    this.model.destroy();
    this.remove();

    transitionSchedule();
  }

});//end UploadView


///////////////////////////////////////////////////////////////
////////////////// UPLOAD COLLECTIONS /////////////////////////
///////////////////////////////////////////////////////////////

var PageCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
	model: Page
});

///////////////////////////////////////////////////////////////
////////////////// UPLOAD COLLECTION VIEW /////////////////////
///////////////////////////////////////////////////////////////

var PageCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend();
		


PagesCollection = new PageCollectionPrototype();

PagesCollection.reset();

PagesCollectionView = new PageCollectionViewPrototype({
          collection: PagesCollection,
          templateSelector: '#page-list',
          renderer: 'underscore',
          el: '#pages-list-el',
          ItemView: PageListView,
          itemParent: '.page-list-container'
        });











    }//end attach
	}//end behav
})(jQuery);
