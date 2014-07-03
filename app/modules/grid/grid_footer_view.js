/* global define */
define([
  'underscore',
  'base/view',
  'text!modules/grid/templates/grid_footer.html'
], function (_, View, template) {
    "use strict";

    var Footer = View.extend({
        template: _.template(template),
        tagName : "tr"
    });

    return Footer;
});
