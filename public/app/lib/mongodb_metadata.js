define([
  "meta/exampleEntity",
  "meta/exampleComplexType",
], function(exampleEntity, exampleComplexType) {
    "use strict";

    var Metadata = function(){

      this.types = [
        exampleEntity
      ];

      this.complexTypes = [
        exampleComplexType
      ];

      this.namespace = "dm";

      this.schema = {
        "metadataVersion": "1.0.5",
        "namingConvention": "noChange",
        "localQueryComparisonOptions": "caseInsensitiveSQL",
      };

      this.schema.dataServices = [];
      this.schema.structuralTypes = [];
      this.schema.resourceEntityTypeMap = {};

      this.initialize = function(){
        if(this.initialized) return true;

        var _this = this;
        for(var i = 0, ii = this.types.length; i < ii; i++){
          _this.applyType(this.types[i], true);
        };

        for(var i = 0, ii = this.complexTypes.length; i < ii; i++){
          _this.applyType(this.complexTypes[i]);
        };

        return this.initialized = true;
      };

      this.applyType = function(type, map){
        this.schema.structuralTypes.push(type);
        if(map){
          this.schema.resourceEntityTypeMap[type.defaultResourceName] = type.shortName + ':#' + type.namespace;
          this.schema.resourceEntityTypeMap[type.shortName] = type.shortName + ':#' + type.namespace;
        }
      };

      this.exportMetadata = function(){
        if(!this.initialized) this.initialize();
        return this.schema;
      };

    };

    return Metadata;
});



