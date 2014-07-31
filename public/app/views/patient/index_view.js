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
  'text!templates/patient/index.html'
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template),

        className: 'banner',

        events: {
          'submit form' : 'createCase',
          'click .js-createCase' : 'createCase'
        },

        model : new Backbone.Model({
          newCase: new Backbone.Model({
            "Description" : '',
            "ImageUrl" : '', 
            "Zipcode" : '', 
            "PatientId" : ''
          }),
          email: '',
        }),

        start: function(options){
          _.bindAll(this, '_createCase', 'createCase');
        },

        createViewModel: function(){
          var viewModel = kb.viewModel(this.model.get('newCase'));
          viewModel.Email = kb.observable(this.model, 'email');
          viewModel.loggedIn = kb.observable(app.user, 'loggedIn');

          return viewModel;
        },

        _createCase: function(){
          this.model.get('newCase').set('PatientId', '_' + app.user.get('_id'));
          app.api.manager.createEntity('Case', this.model.get('newCase').toJSON());
          app.api.manager.saveChanges().then(function(){
             app.router.go('/patient/caseCreated/');
          });
        },

        // TODO add validation // is current member // add gritters
        createCase: function(event){
          event.preventDefault();

          if(!app.user.get('loggedIn')){
            // Check for existing email.
            var query = app.api.breeze
              .EntityQuery
              .from('Patients')
              .where("Email", 'Equals', this.model.get('email'))
              .inlineCount()
              .using(app.api.manager);

              var _this = this;

            return query.execute().then(function(data) {
                if (data.inlineCount > 0) {
                  // Prompt user to log in
                  app.user.login(data.results[0]);
                  _this._createCase();
                } else {
                  // create user
                  app.api.manager.createEntity('Patient', {
                    Email: _this.model.get('email'),
                    Zipcode: _this.model.get('newCase').get('Zipcode')
                  });
                  app.api.manager.saveChanges().then(function(data){
                    app.user.login(data.entities[0]);
                    _this._createCase();
                  });
                }
            });


          } else this._createCase();

        },

        renderComplete: function(){
          jQuery(document).ready(function() {
  
/*******************************  carousel  ***********************************/

  $('.carousel').carousel({
      interval: 3000
    });


  
/*******************************  Nice scroll bar  ***********************************/
  
  $("html").niceScroll({
    background:"#ccc",
    cursorcolor:"#52C1BA",
    cursorwidth:15, 
    boxzoom:true, 
    autohidemode:false,
    zindex:99999,
    cursorborder:"1px solid #52C1BA",
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
