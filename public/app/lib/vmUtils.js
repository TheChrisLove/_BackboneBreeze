define([
  'underscore',
  'backbone',
], function(_, Backbone) {
    "use strict";

    var vmUtils;
    var vmUtils = function(){

      this.get = function(attrStrOrPath, viewModel, returnReference){
        var attrPath = this.attrPath(attrStrOrPath),
          result, _this = this;

        this.walkPath(viewModel, attrPath, function(val, path){
          var attr = _.last(path);
          if (path.length === attrPath.length){
            // attribute found
            result = (_.isFunction(val)) ? val()[attr] : val[attr];
            if(returnReference) result = { ref: ((_.isFunction(val)) ? val() : val), val: result};
          }
        });

        return result;
      };

      // helper for vmTraverse()
      this.attrPath = function(attrStrOrPath){
        var path;

        if (_.isString(attrStrOrPath)){
          // TODO this parsing can probably be more efficient
          path = (attrStrOrPath === '') ? [''] : attrStrOrPath.match(/[^\.\[\]]+/g);
          path = _.map(path, function(val){
            // convert array accessors to numbers
            return val.match(/^\d+$/) ? parseInt(val, 10) : val;
          });
        } else {
          path = attrStrOrPath;
        }

        return path;
      };

      this.walkPath = function(obj, attrPath, callback, scope){
        var val = obj,
          childAttr;

        // walk through the child attributes
        for (var i = 0; i < attrPath.length; i++){
          callback.call(scope || this, val, attrPath.slice(0, i + 1));

          childAttr = attrPath[i];
          val = (_.isFunction(val)) ? val()[childAttr] : val[childAttr];
          if (!val) break; // at the leaf
        }
      };

    };

    return vmUtils;
});



