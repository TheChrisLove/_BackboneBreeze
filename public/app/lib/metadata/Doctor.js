define([], function() {
    "use strict";

    var info = {
      "shortName": "Doctor",
      "namespace": "dm",
      "autoGeneratedKeyType": "KeyGenerator",
      "defaultResourceName": "Doctors",
      "dataProperties": [
        {
          "name": "_id",
          "dataType": "MongoObjectId",
          "isNullable": false,
          "defaultValue": "",
          "isPartOfKey": true,
          "validators": [
            {
              "name": "required"
            }
          ]
        },
        { "name": "FirstName", "dataType": "String" },
        { "name": "LastName", "dataType": "String" },
        { "name": "VetLicenseNumber", "dataType": "String" },
        { "name": "Address", "dataType": "String" },
        { "name": "City", "dataType": "String" },
        { "name": "State", "dataType": "String" },
        { "name": "Zipcode", "dataType": "String" },
        { "name": "Phone", "dataType": "String" },
        { "name": "Phone", "dataType": "String" },
        { "name": "Email", "dataType": "String" },
        { "name": "Website", "dataType": "String" },
        { "name": "PracticeName", "dataType": "String" },
        { "name": "ImageUrl", "dataType": "String" },
        { "name": "Password", "dataType": "String" },
        { "name": "Rating", "dataType": "Number" },
        { "name": "UserId", "dataType" : "MongoObjectId" }
      ],
      "navigationProperties":[
        {
            "name":"Bids",
            "entityTypeName":"Bid:#dm",
            "isScalar":false,
            "associationName":"Doctor_Bids",
            "invForeignKeyNames" : ["DoctorId"]
        }
        
      ]
    }
    
    return info;

  });