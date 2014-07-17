define([], function() {
    "use strict";

    var info = {
      "shortName": "ExampleComplexType",
      "namespace": "dm",
      "isComplexType" : true,
      "dataProperties": [
        {
            "name":"Modifiers",
            "complexTypeName":"Modifier:#dm",
            "isScalar":false
        },
        {
          "name": "Name",
          "dataType": "String"
        },
        {
          "name": "Description",
          "dataType": "String"
        },
        {
          "name": "Notes",
          "dataType": "String"
        }
      ]
    }
    
    return info;

  });