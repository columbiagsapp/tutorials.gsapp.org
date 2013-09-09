(function ($){
	Drupal.behaviors.app = {
    	attach: function() {

///////////////////////////////////////////////////////////////
////////////////// UPLOAD MODEL ///////////////////////////////
///////////////////////////////////////////////////////////////

var Upload = Drupal.Backbone.Models.Node.extend({
  initialize: function(opts){
    Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
    //need to not send any node refs on .save() because it requires { nid: [nid: ## ]} structure
    //needed to take out a bunch when using REST WS - last_view seems to be the culprit
    this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id']);
  }
});

///////////////////////////////////////////////////////////////
////////////////// UPLOAD VIEWS ///////////////////////////////
///////////////////////////////////////////////////////////////

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

});//end UploadView


///////////////////////////////////////////////////////////////
////////////////// UPLOAD COLLECTIONS /////////////////////////
///////////////////////////////////////////////////////////////

var UploadCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
	model: Upload
});

///////////////////////////////////////////////////////////////
////////////////// UPLOAD COLLECTION VIEW /////////////////////
///////////////////////////////////////////////////////////////

var UploadCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend();
		}//end attach
	}//end behav
})(jQuery);
