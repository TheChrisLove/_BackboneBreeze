/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'knockback',
  'knockout',
  'text!templates/shared/submenu.html'
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var SubmenuView = View.extend({

        className: "submenu",

        template: _.template(template),

        events: {},

        start: function () {},

        createViewModel: function(){
          return kb.viewModel(this.model, { excludes: ['actions', 'views']});
        }

    });

    return SubmenuView;
});