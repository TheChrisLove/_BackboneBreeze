define([], function() {
    "use strict";

    var info = {
      "shortName":"Case_bid",
      "namespace":"dm",
      "isComplexType":true,
      "dataProperties": [
        { "name": "DoctorId", "dataType": "MongoObjectId" },
        { "name": "Bid", "dataType": "String" },
        { "name": "Created", "dataType": "String" },
        { "name": "Modified", "dataType": "String" },
      ]
    }
    
    return info;

  });