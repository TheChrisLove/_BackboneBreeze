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

        _vmBidsHelper : function(bids){

        },

        createViewModel: function(options) {
            var viewModel = kb.viewModel(this.model, {
                excludes: ['Bids', 'Created']
            });

            viewModel.Bids = app.utils.trackedBreezeCollection(this.model.get('Bids'), true);
            viewModel.Created = app.utils.formatDateTime(this.model.get('Created'));

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
            });


            viewModel.winningBid = ko.computed(function(){
                return (this._winningBid()) ? '$' + this._winningBid() : 'N/A';
            }, viewModel);

            if(app.user.get('AccountType') == 'Doctor'){
                viewModel.myBid = ko.computed(function(){
                    var bids = this.Bids();
                    var run = bids.length;
                    var myBid = null;
                    while(run--){
                        if(bids[run].Bid() > winner) winner = bids[run].Bid();
                    }
                    return '$290';
                }, viewModel);

                viewModel.nextBid = ko.computed(function(){
                    var nextBid = this._winningBid();
                    return (nextBid) ? '$' + (nextBid + 10) : '$10';
                }, viewModel);
            }

            return viewModel;
        }
    });

    return BasicView;
});
