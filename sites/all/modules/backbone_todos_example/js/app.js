var Todos;
var app = app || {};

(function($) {
  Drupal.behaviors.todos = {
    attach: function() {

      // Todo Model
      Drupal.Backbone.Models.Todo = Drupal.Backbone.Models.Node.extend({
        defaults: function() {
          return {
            title: 'empty todo...',
            type: 'todo',
            log: 'not done',
            field_todo_order: {und: [{value: Todos.nextOrder()}]},
          };
        },

        initialize: function() {
          if (!this.get("title")) {
            this.set({"title": this.defaults().title});
          }
        },

        toggle: function() {
          this.save({log: this.get('log') == 'done' ? 'not done' : 'done'}, {
            success: function(model, response) {
              // model.fetch();
            }
          });
        },

        clear: function() {
          this.destroy();
        }
      });

      // Todo Collection
      Drupal.Backbone.Collections.TodoList = Drupal.Backbone.Collections.NodeView.extend({
        model: Drupal.Backbone.Models.Todo,
      
        done: function() {
          return this.filter(function(todo) { return todo.get('log') == 'done' });
        },

        remaining: function() {
          return this.without.apply(this, this.done());
        },

        nextOrder: function() {
          if (!this.length) return 1;
          return this.last().get('field_todo_order').und[0].value + 1;
        },

        comparator: function(todo) {
          return todo.get('field_todo_order').und[0].value;
        }
      });

      // Create our global collection of **Todos**.
      Todos = new Drupal.Backbone.Collections.TodoList;
      Todos.viewName = 'todos';

      // Todo Item View
      // --------------

      // The DOM element for a todo item...
      var TodoView = Backbone.View.extend({

        //... is a list tag.
        tagName:  "li",

        // Cache the template function for a single item.
        template: _.template($('#item-template').html()),

        // The DOM events specific to an item.
        events: {
          "click .toggle"   : "toggleDone",
          "dblclick .view"  : "edit",
          "click a.destroy" : "clear",
          "keypress .edit"  : "updateOnEnter",
          "blur .edit"      : "close"
        },

        // The TodoView listens for changes to its model, re-rendering. Since there's
        // a one-to-one correspondence between a **Todo** and a **TodoView** in this
        // app, we set a direct reference on the model for convenience.
        initialize: function() {
          this.model.bind('change', this.render, this);
          this.model.bind('destroy', this.remove, this);
        },

        // Re-render the titles of the todo item.
        render: function() {
          this.$el.html(this.template(this.model.toJSON()));
          this.$el.toggleClass('done', this.model.get('log') == 'done');
          this.input = this.$('.edit');
          return this;
        },

        // Toggle the `"done"` state of the model.
        toggleDone: function() {
          this.model.toggle();
        },

        // Switch this view into `"editing"` mode, displaying the input field.
        edit: function() {
          this.$el.addClass("editing");
          this.input.focus();
        },

        // Close the `"editing"` mode, saving changes to the todo.
        close: function() {
          var value = this.input.val();
          if (!value) this.clear();
          this.model.save({title: value}, {success: function(model, response) {  
	    // model.fetch(); 
          }});
          this.$el.removeClass("editing");
        },

        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function(e) {
          if (e.keyCode == 13) this.close();
        },

        // Remove the item, destroy the model.
        clear: function() {
          this.model.clear();
        }

      });

      // The Application
      // ---------------

      // Our overall **AppView** is the top-level piece of UI.
      var AppView = Drupal.Backbone.View.extend({

        el: $("#todoapp"),
  
        // Our template for the line of statistics at the bottom of the app.
        statsTemplate: _.template($('#stats-template').html()),

        // Delegated events for creating new items, and clearing completed ones.
        events: {
          "keypress #new-todo":  "createOnEnter",
          "click #clear-completed": "clearCompleted",
          "click #toggle-all": "toggleAllComplete"
        },

        // At initialization we bind to the relevant events on the `Todos`
        // collection, when items are added or changed. Kick things off by
        // loading any preexisting todos that might be saved in *localStorage*.
        initialize: function() {

          Drupal.Backbone.View.prototype.initialize.apply(this);

          this.input = this.$("#new-todo");
          this.allCheckbox = this.$("#toggle-all")[0];

          Todos.bind('add', this.addOne, this);
          Todos.bind('reset', this.addAll, this);
          Todos.bind('all', this.render, this);

          this.footer = this.$('footer');
          this.main = $('#todoapp-main');

          Todos.fetch({});
        },

        // Re-rendering the App just means refreshing the statistics -- the rest
        // of the app doesn't change.
        render: function() {
          var done = Todos.done().length;
          var remaining = Todos.remaining().length;

          if (Todos.length) {
            this.main.show();
            this.footer.show();
            this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
          } else {
            this.main.hide();
            this.footer.hide();
          }

          this.allCheckbox.checked = !remaining;
        },

        // Add a single todo item to the list by creating a view for it, and
        // appending its element to the `<ul>`.
        addOne: function(todo) {
          var view = new TodoView({model: todo});
          $("#todo-list").append(view.render().el);
        },

        // Add all items in the **Todos** collection at once.
        addAll: function() {
          Todos.each(this.addOne);
        },

        // If you hit return in the main input field, create new **Todo** model,
        // persisting it to *localStorage*.
        createOnEnter: function(e) {
          if (e.keyCode != 13) return;
          if (!this.input.val()) return;

          Todos.create({title: this.input.val()});
          this.input.val('');
        },

        // Clear all done todo items, destroying their models.
        clearCompleted: function() {
          _.each(Todos.done(), function(todo){ todo.clear(); });
          return false;
        },

        toggleAllComplete: function () {
          var done = this.allCheckbox.checked;
          Todos.each(function (todo) { todo.save({log: done ? 'done' : 'not done'}, {success: function(model, response) { /*this.fetch();*/ }});});
        }

      });

      // Finally, we kick things off by creating the **App**.
      app = new AppView;
    }
  };

})(jQuery);
