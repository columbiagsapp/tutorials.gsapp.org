(function ($){
	Drupal.behaviors.app = {
    	attach: function() {
/* Tumblr API functionality, inspired by https://github.com/jokull/tumblr-widget */
var TumblrFeed = Drupal.Backbone.Models.Node.extend({
  initialize: function(opts){
    Drupal.Backbone.Models.Node.prototype.initialize.call(this, opts);
    this.addNoSaveAttributes(['body', 'views', 'day_views', 'last_view', 'uri', 'resource', 'id']);
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
  initialize: function(options){
    this.endpoint = this.endpoint + options.hostname;
    return this.params = _.extend(this.params, options.params || {});
  },
  page: function(){
    console.log('Tumblr.page()');

    var params,
        _this = this;
    params = _.extend(this.params, {
      offset: this.length - 1
    });
    return $.ajax({
      url: this.endpoint + '/posts/json?' + ($.param(params)),
      dataType: "jsonp",
      jsonp: "jsonp",
      success: function(data, status){
        _this.add(data.response.posts);
        _this.trigger('paged');
        if(data.response.total_posts === _this.length){
          console.log('Tumblr: triggering last');
          return _this.trigger('last');
        }
      }
    });
  }
});//end Tumblr

var TumblrPostView = Backbone.View.extend({
  className: "tumblr-post",
  initialize: function(options){
    if(this.model) return this.model.bind("change", this.render);
  },
  render: function(){
    var tpl;
    tpl = _.template(($('#tpl-tumblr-post')).html());
    ($(this.el)).addClass(this.model.get('type'));
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

 function initTumblrFeed(el, hostname, tags, limit){
  var tagCSV = tags.join(', ') || '';//default to none
  limit = limit || 1;

  tumblr.collection = new Tumblr({
    hostname: hostname,
    params: {
        api_key: 'yqwrB2k7eYTxGvQge4S8k9R6wAdQrATjLXhVzGVPgjTXwucNOo'
       ,tag: tagCSV
       ,limit: limit
    }
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
		}//end attach
	}//end behav
})(jQuery);
