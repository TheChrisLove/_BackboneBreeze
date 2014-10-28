/* global define, app */
// Basic View
// ----------

// Use this as an easy starting point for the creation of new views */
define([
  'underscore',
  'backbone',
  'base/view',
  'knockback',
  'knockout',
  'text!templates/patient/index.html',
  'models/createCase'
], function (_, Backbone, View, kb, ko, template, CaseCreationModel) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template),

        className: 'banner',

        events: {
          'submit form' : 'createCase',
          'click .js-createCase' : 'createCase'
        },

        start: function(options){
          _.bindAll(this, 'createCase');
          this.model = new CaseCreationModel();
        },

        createViewModel: function(){
          var viewModel = kb.viewModel(this.model.get('newCase'));
          viewModel.Email = kb.observable(this.model, 'email');
          viewModel.loggedIn = kb.observable(app.user, 'loggedIn');

          return viewModel;
        },

        createCase: function(event){
          event.preventDefault();
          this.model.createCase();
        },
        
        renderComplete: function(){
          jQuery(document).ready(function() {
  
/*******************************  carousel  ***********************************/

  /*$('.carousel').carousel({
      interval: 3000
    });


  
/*******************************  Nice scroll bar  ***********************************/
  
  $("html").niceScroll({
    background:"#ccc",
    cursorcolor:"#722881",
    cursorwidth:15, 
    boxzoom:true, 
    autohidemode:false,
    zindex:99999,
    cursorborder:"1px solid #722881",
  });


/*******************************  go to top arrow ***********************************/
  $(window).scroll(function(){
     if ($(this).scrollTop() > 100) {
       $('.scrollup').fadeIn();
     } else {
       $('.scrollup').fadeOut();
     }
   }); 
 
   $('.scrollup').click(function(){
     $("html, body").animate({ scrollTop: 0 }, 600);
     return false;
   });



  

  /***********************  Slider Revolution  ***************************/
  if($('.banner').length) {
    $('.banner').revolution({
      startheight:500,
      startwidth:1200,
      onHoverStop: "on",
      hideThumbs:1,
      navigationType: "bullet",
      navigationStyle: "round",
      shadow:0,
    });    
  }



  /******************************  Grid  *********************************/
  if($('#tt-grid-wrapper').length) {
    grid();
  }


  /*****************************  Filters  *******************************/
  if($('.filters').length) {
    $('.filters li').click(function (e) {
      e.preventDefault()
      
      filter = $(this).data('filter');

      $('.grid ul li').hide();
      $('.filters li').removeClass('active')

      $(this).addClass('active')
      
      if (filter == 'all'){
        $('.grid ul li').show()
      }else {
        $('.grid ul li.'+filter).show()
      }
    })
  }




}); //end document ready


        }

    });

    return BasicView;
});
