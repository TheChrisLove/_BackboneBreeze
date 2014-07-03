/* global define */
define([
  'underscore',
  'backbone',
  'base/view',
  'knockback',
  'knockout',
  'text!templates/shared/sidebarMenu.html'
], function (_, Backbone, View, kb, ko, template) {
    "use strict";

    var SidebarMenuView = View.extend({

        className: "sidebar",
        
        template: _.template(template),

        createViewModel: function(){
          return {
            modules : kb.collectionObservable(this.model.get('modules'))
          };
        }

    });

    return SidebarMenuView;
});