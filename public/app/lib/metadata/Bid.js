define([], function() {
    "use strict";

    var info = {
      "shortName":"Case_bid",
      "namespace":"dm",
      "isComplexType":true,
      "dataProperties": [
        { "name": "DoctorId", "dataType": "MongoObjectId" },
        { "name": "Bid", "dataType": "Number" },
        { "name": "Created", "dataType": "String" },
        { "name": "Modified", "dataType": "String" },
        { "name": "Winner", "dataType": "Boolean" },
        { "name": "WinnerEmail", "dataType": "String" }
      ]
    }
    
    return info;

  });