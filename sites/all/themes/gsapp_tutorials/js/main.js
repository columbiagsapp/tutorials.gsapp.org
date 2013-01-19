require.config({
  baseUrl: 'http://tutorials.gsapp.org/js',

  //set up paths to external files
  paths: {
    'jquery-min': 'https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min',
    'jquery-ui': 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui'
  },

  //set up load order/dependencies
  shim: {
    'jquery-min': {
      exports: '$'
    },
    'jquery-ui': {
      deps: ['jquery-min'],
      exports: 'jquery-ui'
    },
    'underscore-min': {
      deps: ['jquery-min'],
      exports: '_'
    },
    'backbone-min': {
      deps: ['underscore-min', 'jquery-min'],
      exports: 'Backbone'
    }
  }
});//end require config

var D;

require([
  'jquery-min',
  'underscore-min',
  'backbone-min',
  'drupalbackbone'
],

function($, _, BackboneT, Drupal) {
  console.log('running main.js');
  var N = Backbone.Model.extend();

  $('body').append('<div>TROY</div>');

  console.log('Drupal.Backbone:');
  console.dir(Drupal.Backbone);

  var M = Drupal.Backbone.Models.Base.extend();

  console.log('running main.js');
  $('body').append('<div>TROY</div>');



});