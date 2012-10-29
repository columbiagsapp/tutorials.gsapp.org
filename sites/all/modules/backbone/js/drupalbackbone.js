// A Child of [Backbone.JS][backbone] with Drupal Services defaults.
//
//
//
// * TODO Add .TaxonomyCollection with support for taxonomy listings.
// * TODO Add .SearchCollection with support for search results.
// * TODO Add configurable endpoint path, loaded via Drupal.settings.
//   (will remove hard dependency on backbone_base feature)
// * TODO Add .FieldViewCollection for working with field views.
//
// [backbone]: http://documentcloud.github.com/backbone

(function($) {

  // Attached to page via Drupal behaviors, for reasons
  // of both properness and so we can use Drupal JS setings.
  Drupal.behaviors.backbone = function() {
    // Drupal.Backbone
    // ---
    //
    // Starts with the Drupal.Backbone Constructor, currently a no-op
    Drupal.Backbone = function() {};
    Drupal.Backbone.Models = {};
    Drupal.Backbone.Collections = {};
    Drupal.Backbone.Views = {};

    // Base objects for Drupal Backbone implementation.
    // ---

    // ### Drupal.Backbone.Model
    //
    // Extend the Model object with default Drupal Services settings and methods.
    // These are defaults for interfacing with all Service module's providers.
    Drupal.Backbone.Models.Base = Backbone.Model.extend({
      // Base endpoint, used to create full url for each collection.
      restEndpoint: Drupal.settings.backbone.endpoint || "",

      // Both Services and RESTWS use the format
      // "{endpoint}/{resource-type}/{id}.json, only {endpoint} is empty for
      // RESTWS.
      // We don't include the collection stuff here, since Drupal collections are
      // indpendent of their objects.
      url: function() {
        // Modified from Backbone.js to ignore collection and add ".format" extension.
        var base = this.restEndpoint + this.urlRoot || urlError();
        if (this.isNew()) { return base; }
        // Add .json for format here.
        return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id) + ".json";
        }
    });

    // ### Drupal.Backbone.Collection
    //
    // Currently just sets the endpoint for all collections.
    //
    // TODO fix scoping issue that causes params to bleed between children of this object.
    //  e.g. if you have two NodeViewCollections, setting limit on one sets on both.
    Drupal.Backbone.Collections.Base = Backbone.Collection.extend({
      // Base endpoint, used to create full url for each collection.
      restEndpoint: Drupal.settings.backbone.endpoint || "/backbone/rest",

      // #### initialize()
      //
      // We bind the param functions to this on initialize, to avoid chain
      // inheritance issues.
      //
      // *NOTE* if you subclass this and have an initialize function in your
      // subclass, you need to execute Drupal.Backbone.Collection.initialize
      // explicitly.
      initialize: function() {
        _.bindAll(this, 'setParam', 'setParams', 'getParams');
        this.params = {};
      },

      // #### params
      //
      // Drupal collections are stateful, we store params in the collection.
      params: {},

      // #### setParam(string, string)
      //
      // Setter for individual params, called as setParam('name','value').
      setParam: function(paramName, paramValue) {
        this.params[paramName] = paramValue;
      },

      // #### setParams(object)
      //
      // Setter for multiple params, passed as object with key/value pairs.
      setParams: function(params) {
        if (typeof(this.params) !== 'object') {
          this.params = object;
        }
        if (typeof(params) === 'object') {
          _.extend(
            this.params,
            params
          );
        }
      },

      // #### getParams()
      //
      // Getter. Currently just returns param object property.
      getParams: function() {
        return this.params;
      },

      // #### fetch() implementation
      //
      // Fetch method passes params as data in AJAX call.
      fetch: function(options) {
        if (options.data) {
          // Allow options.data to override any params.
          _.defaults(options.data, this.getParams());
        }
        else if (this.getParams()) {
          options.data = this.getParams();
        }
        // Call Super fetch function with options array including any collection params.
        Backbone.Collection.prototype.fetch.call(this, options);
      }
    });

    // ### Drupal.Backbone.Views.Base
    //
    // The parent class for most rendered Drupal Backbone views, this object
    // mainly contains functions for standardizing and abstracting calls to
    // the template library and references to templates.  It meant to be
    // easily extended, so you can focus on logic and presentation of content
    // types, view data etc., and minimize boilerplate code.  At the same time
    // the template engine specifics have been abstracted out, so that
    // switching to a differen template library (such as Handlebars.js),
    // should be as easy as overriding the compileTemplate and/or
    // executeTemplate functions, with everything else remaining the same.
    //
    //    * TODO add parentEl property, and automatically attach the new el
    //      if it exists as part of this.render()
    Drupal.Backbone.Views.Base = Backbone.View.extend({

      // #### initialize
      //
      // Initialize our view by preparing the template for later rendering.
      //
      // This can work in either of two ways:
      //
      //    1. by passing Drupal.Backbone.View.create() an options object with
      //       a jQuery object or selector pointing to the template or the actual
      //       source of the template to be loaded.
      //    2. by subclassing this object and setting either the
      //       templateSelector or templateSource propoerties. Note that you
      //       need to be sure to call this initialize function in your
      //       subclass if you override the initialize function there. Example
      //       code would look like:
      //
      //           myDrupalBackboneView = Drupal.Backbone.View.extend({
      //             templateSelector: '#template-id'
      //           });
      initialize: function(opts) {
        _.bindAll(this,
            'getTemplate',
            'compileTemplate',
            'getTemplateSource',
            'loadTemplate',
            'setTemplateSource',
            'getTemplate',
            'executeTemplate',
            'render',
            'unrender'
           );
        if (typeof(opts) !== 'object') {
          opts = {};
        }
        this.setTemplateSource(opts.templateSource || this.templateSource);
        this.templateSelector = opts.templateSelector || this.templateSelector;
        if (this.getTemplateSource()) {
          this.compileTemplate();
        }
      },

      // #### compileTemplate()
      //
      // Compile our template code as a template object.
      //
      // This is using _.template(), but so long as template objects have an
      // execute function all we should need to do is override this method to
      // implement new template libraries.
      compileTemplate: function(source) {
        this.template = _.template(source || this.getTemplateSource());
      },

      // #### executeTemplate()
      //
      // Wrapper around tempating library's render function. By default this
      // is executing the template object itself, the _.template standard,
      // this should also work for Handlebars. For other systems this may need
      // to be overridden.
      executeTemplate: function(variables) {
        return this.template(variables);
      },

      // #### getTemplateSource()
      //
      // Returns the source for the template.  If the templateSource property
      // is not set, it will check the templateSeclector and try to load the
      // template from code.
      getTemplateSource: function() {
        if (!this.templateSource && this.templateSelector) {
          this.loadTemplate(this.templateSelector);
        }
        return this.templateSource;
      },

      // #### loadTemplate()
      //
      // Load template from jQuery object or selector. If no selector is
      // passed, uses the templateSelector property of the view.
      loadTemplate: function(selector) {
        selector = selector || this.templateSelector;
        if (typeof(selector) === 'object') {
          this.setTemplateSource(selector.html());
        }
        else if (typeof(selector) === 'string') {
          this.setTemplateSource($(selector).html());
        }
      },

      // #### setTemplateSource()
      //
      // Setter for the template source property.
      setTemplateSource: function(source) {
        this.templateSource = source;
      },


      // #### getTemplate()
      //
      // Function to encapsulate the logic for getting the template, and
      // loading as needed from selector or source.
      getTemplate: function() {
        if (!this.templateSource && this.templateObj) {
          this.setTemplateSource(this.templateObj.html());
        }
        else if (this.templateSource) {
          return this.compileTemplate(this.templateSource);
        }
      },

      // #### render()
      //
      // Default render function, passes entire model attributes object to
      // template, renders using executeTemplate() method and then appends to
      // this.el.
      render: function(){
        var variables = {};
        if (this.model) {
          variables = this.model.toJSON();
        }
        $(this.el).html(this.executeTemplate(variables));
        // return ```this``` so calls can be chained.
        return this;
      },

      // #### unrender()
      //
      // Default unrender method, removes this.el from DOM.
      unrender: function() {
        $(this.el).remove();
        return this;
      }
    }); // end extend

    // Set Backbone.TypeName to Base Objects for Legacy Compatability.
    // NOTE: These object references are deprecated and could go away!
    Drupal.Backbone.View = Drupal.Backbone.Views.Base;
    Drupal.Backbone.Model = Drupal.Backbone.Models.Base;
    Drupal.Backbone.Collection = Drupal.Backbone.Collections.Base;
  };

})(jQuery);

