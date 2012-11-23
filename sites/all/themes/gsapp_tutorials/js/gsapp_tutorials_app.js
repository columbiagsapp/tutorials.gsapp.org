(function ($) {
$(document).ready(function () {
  console.log('starting up'+ $('body').attr('class') );
  
  var question = new Drupal.Backbone.Models.Node({
        nid: 189
      });

  var questionView = Drupal.Backbone.Views.Base.extend({
    templateSelector: '#bb_question_template',
    renderer: "underscore",
    initialize: function(opts) {
      this.model = opts.model;
      this.model.bind('change', this.render, this);
      Drupal.Backbone.View.prototype.initialize.apply(this);
      console.log('init questionView');

      
    }

  });

  var questionViewRenderer = new questionView({
    model: question,
    el: '#question-container-el'
  });


  question.fetch({
    success: function() {
      questionViewRenderer.render();
    }
  });

//});


  /*

  var NodeView = Drupal.Backbone.Views.Base.extend({
    templateSelector: '#bb_node_template',
    initialize: function(opts) {
      this.model = opts.model;
      this.model.bind('change', this.render, this);
      Drupal.Backbone.View.prototype.initialize.apply(this);
      console.log('init nodeView');
    }
  });

      // ### AppView
      //
      // As mentioned above, a standard Backbone pattern is to use one main View
      // object as the controller for the application UI.  In this case, that
      // view is mainly a form, with bindings for the submit button that request
      // the node data from the server, and an initialize function that sets
      // everything up for us.
      var AppView = Drupal.Backbone.Views.Base.extend({

        // #### AppView.templateSelector
        //
        // This property functions the same way as NodeView.templateSelector.
        templateSelector: '#bb_app_template',

        events: {
          'submit form[name=question-add-form]': 'doLoadNode'
        },

        initialize: function() {
          Drupal.Backbone.View.prototype.initialize.apply(this);
          _.bindAll(this, 'doLoadNode');
          this.nodeModel = new Drupal.Backbone.Models.Node();
          this.nodeView = new NodeView({model: this.nodeModel});
          //$('#question-add-anchor-div').append(this.render().el);
          this.$('#new-question-container').append(this.nodeView.render().el);
          //doLoadNode(98);
          console.log('gsapp tutorials bb app init');
        },

        // #### AppView.doLoadNode()
        //
        // This is the method that is called whenever the form is submitted.  It
        // gets the value of the nid input field, sets the model to have the new
        // nid property, then fetches the rest of the node data from the server.
        //
        // We don't need to worry about doing anything when the results come
        // back (whew!), because Backbone will automatically update the model
        // when it receives new data.  Once the model has been updated, a change
        // event will be called, triggering a re-render of the node view thanks
        // to our earlier binding of the view render function to change.
        doLoadNode: function(nid) {
          nid = this.$('#nid').val();
          this.nodeModel.set('nid', nid);
          this.nodeModel.fetch();
        }
      });

      // ### Start the app!
      //
      // Then all we need to do is create an instance of our app view!
      var app = new AppView();
    //},

    // ## unattach()
    //
    // Just to be consistent with Drupal standards, we provide an unattach
    // function as well.
    //unattach: function() {
    //  $('#question-add-anchor-div').html('');
    //}
  //};
});
}(jQuery));

*/
});
}(jQuery));