/* global define, app */
// Basic View
// ----------

// Use this as an easy starting point for the creation of new views */
define([
  'underscore',
  'backbone',
  'modules/grid/grid_row_view',
  'knockback',
  'knockout',
  'text!templates/patient/case_view.html' 
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var BasicView = View.extend({

        template: _.template(template), 

        tagName: 'li',

        events: {
            'click .js_bid' : 'bid',
            'click .js_updateBid' : 'updateBid',
            'click .js_viewBids' : 'viewBids'
        },

        start: function(){
            _.bindAll(this, 'bid', '_createBid', '_updateBid', 'bidViewModel');
        },

        viewBids: function(event){
            var $viewBids = this.$el.find('.viewBids');
            if($viewBids.hasClass('expanded')) $viewBids.removeClass('expanded').slideUp();
            else $viewBids.addClass('expanded').slideDown();
            // make call to expand bids

            var ids = [];
            var predicates = [];
            var bids = this.model.get('Bids');
            var run = bids.length;
            while(run--){
                ids.push(bids[run].get('DoctorId'));
            };
            run = ids.length;
            while(run--){
                predicates.push(app.api.Predicate.create('_id', 'Equals', ids[run]));
            }
            var predicate = (predicates.length > 1) ? app.api.Predicate.or(predicates) : predicates[0];
            var _this = this;
            app.api.breeze.EntityQuery.from('Doctors').where(predicate).using(app.api.manager).execute().then(function(data){
                _this.viewModel._Doctors.add(data.results);
            });

        },

        bid: function(event){
            var _this = this;
            var amount = $(event.currentTarget).parents('.input-group').find('input').val();
            app.modal.show({
                title: 'Are you sure?',
                content: 'You are about to make a bid of $' + amount+ '.  Are you sure you wish to continue?',
                buttons: [{
                    name: 'Yes! Bid Now!',
                    fn: function(){
                        _this._createBid(amount);
                    }
                }]
            })

        },

        updateBid: function(event){
            var _this = this;
            var amount = $(event.currentTarget).parents('.input-group').find('input').val();
            app.modal.show({
                title: 'Are you sure?',
                content: 'You are about to updated your bid to $' + amount+ '.  Are you sure you wish to continue?',
                buttons: [{
                    name: 'Yes! Update Bid!',
                    fn: function(){
                        _this._updateBid(amount);
                    }
                }]
            })
        },

        _updateBid: function(amount){
            var bids = this.model.get('Bids');
            var run = bids.length;
            var doctorId = app.user.getDoctorId();
            while(run--){
                if(bids[run].get('DoctorId') == doctorId){
                    bids[run].set({
                        Bid : amount,
                        Modified: new Date()
                    });
                    return app.api.manager.saveChanges().then(function(){
                        app.modal.close();
                        $.gritter.add({
                            title: 'Success',
                            text: 'Your bid has been updated!'
                        });
                    })
                }
            }
        },

        _createBid: function(amount){
            var bid = {
                DoctorId : app.user.getDoctorId(),
                Bid: amount,
                Created: new Date(),
                Modified: new Date()
            };

            this.model.get('Bids').push(app.api.manager.metadataStore
              .getEntityType('Case_bid')
              .createInstance(bid));

            app.api.saveChanges([this.model]).then(function(){
                app.modal.close();
                $.gritter.add({
                    title: 'Bid Created!',
                    text: 'Your bid has been successfully created!'
                });
            })
        },

        bidViewModel: function(model){
            //console.log('vm creating' + model);
            console.log('vm creating' + model);
        },

        createViewModel: function(options) {
            var _this = this;
            var viewModel = kb.viewModel(this.model, {
                excludes: ['Bids', 'Created']
            });
            app.testing = viewModel;

            viewModel.Bids = app.utils.trackedBreezeCollection(this.model.get('Bids'), true);
            viewModel.Created = app.utils.formatDateTime(this.model.get('Created'));
            // TODO create method to ;build a tracked queryEngine collection
            viewModel._Doctors = new Backbone.Collection([]);
            viewModel.Doctors = kb.collectionObservable(viewModel._Doctors, {
                factories: {
                    'models': function(model){
                        return _this.bidViewModel(model);
                    }
                }
            });


            viewModel.numberBids = ko.computed(function(){
                return this.Bids().length;
            }, viewModel);

            viewModel._winningBid = ko.computed(function(){
                var bids = this.Bids();
                var run = bids.length;
                var winner = null;
                while(run--){
                    if(bids[run].Bid() > winner) winner = bids[run].Bid();
                }
                return winner;
            }, viewModel);


            viewModel.winningBid = ko.computed(function(){
                return (this._winningBid()) ? '$' + this._winningBid() : 'N/A';
            }, viewModel);

            if(app.user.get('info').get('AccountType') == 'Doctor'){

                var doctorId = app.user.getDoctorId();

                viewModel.myBid = ko.computed(function(){
                    var bids = this.Bids();
                    var run = bids.length;
                    var myBid = null;
                    while(run--){
                        if(bids[run].DoctorId() == doctorId) return '$' + bids[run].Bid();
                    }
                    return 'N/A';
                }, viewModel);

                viewModel.nextBid = ko.computed(function(){
                    var nextBid = parseFloat(this._winningBid());
                    return (nextBid) ? (nextBid + 10) : '10';
                }, viewModel);

                viewModel.bidButtonText = ko.computed(function(){
                    return (this.myBid() != 'N/A') ? 'Update Bid' : 'Bid!';
                }, viewModel);
            }

            return viewModel;
        }
    });

    return BasicView;
});
