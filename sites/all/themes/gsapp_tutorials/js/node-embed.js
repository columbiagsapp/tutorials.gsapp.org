(function ($){
  Drupal.behaviors.app = {
      attach: function() {

///////////////////////////////////////////////////////////////
////////////////// EMBED MODELS ///////////////////////////////
///////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////
////////////////// EMBED VIEWS ////////////////////////////////
///////////////////////////////////////////////////////////////

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

});//end EmbedView


///////////////////////////////////////////////////////////////
////////////////// EMBED COLLECTIONS //////////////////////////
///////////////////////////////////////////////////////////////

var EmbedCollectionPrototype = Drupal.Backbone.Collections.RestWS.NodeIndex.extend({
  model: Embed
});

///////////////////////////////////////////////////////////////
////////////////// EMBED COLLECTION VIEWS /////////////////////
///////////////////////////////////////////////////////////////

var EmbedCollectionViewPrototype = Drupal.Backbone.Views.CollectionView.extend();
    }//end attach
  }//end behav
})(jQuery);
