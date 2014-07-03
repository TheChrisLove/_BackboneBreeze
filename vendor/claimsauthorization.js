//Check - JSON store object is valid or not before commit using the http://jsonlint.com/ or any tool.
/* get objects */
/*
    Read the --   authorizationStore.JSON -- this is prepared as per the User Profile Guide_V6.

    Hierarchy - Module-> Tab-> Link-> Button.
    Example of showing / hiding in html page.
    
    data-bind: visible=
    
    ModuleObject().IsVisible
    TabObject('User Manager').IsVisible
    LinkObject('User Manager','Add User').IsVisible
    ButtonObject('User Manager','Add User','save').IsVisible
*/

var AuthObj = {

    ModuleObject: function() {
        var curModule = {
            "IsVisible": false
        };
        //This claims key will be getting from DB dynamically for a particular module
        if (typeof app !== "undefined") {
            var lstClaimKeyValues = AuthObj.getClaimTypeValuesForActiveModule();
            if (lstClaimKeyValues) {
                //Multiple profiles may be attached to the same user - "Administrator" - "User Manager", "Supervisor" - "User Manager"
                $.each(lstClaimKeyValues, function(pos, item) {
                    if (item && item.ClaimValue) {
                        //taking priority for Administrator role - 
                        curModule = AuthObj.getModuleObject(item.ClaimValue)
                        if (item.ClaimValue.toLowerCase() == "administrator") {
                            return false;
                        }
                    }
                });
            }
        } else {
            curModule.IsVisible = true;
        }
        return curModule;
    },

    getModuleObject: function(ClaimRole) {
        var curModule = {
            "IsVisible": false
        };
        //By the time user comes to link level, module authorized.
        var allClaimsModules = AuthObj.getAllModulesByClaimValue(ClaimRole);
        if (allClaimsModules && allClaimsModules.modules) {
            var curModule = AuthObj.getModuleLevelPropertiesByModule(allClaimsModules);
            if (curModule) {
                return curModule;
            }
        }
        return curModule;
    },

    TabObject: function(tabName) {
        var curTab = {
            "IsVisible": false
        };
        if (tabName && tabName.trim().length > 0) {
            var lstClaimKeyValues = AuthObj.getClaimTypeValuesForActiveModule();
            if (lstClaimKeyValues) {
                $.each(lstClaimKeyValues, function(pos, item) {
                    if (item && item.ClaimValue) {
                        curTab = AuthObj.getTabObject(item.ClaimValue, tabName)
                        if (item.ClaimValue.toLowerCase() == "administrator") {
                            return false;
                        }
                    }
                });
            }
        }
        return curTab;
    },

    getTabObject: function(ClaimRole, tabName) {
        var curTab = {
            "IsVisible": false
        };

        var curModule = AuthObj.getModuleObject(ClaimRole);
        if (curModule && curModule.Tabs && curModule.IsVisible) {
            var PresentTab = AuthObj.getTabPropertiesForATabInModule(curModule, tabName);
            if (PresentTab) {
                return PresentTab;
            }
        }

        return curTab;
    },

    LinkObject: function(tabName, linkName) {
        var curLink = {
            "IsVisible": false
        };
        if (tabName && tabName.trim().length > 0 && linkName && linkName.trim().length > 0) {
            var lstClaimKeyValues = AuthObj.getClaimTypeValuesForActiveModule();
            if (lstClaimKeyValues) {
                $.each(lstClaimKeyValues, function(pos, item) {
                    if (item && item.ClaimValue) {
                        curLink = AuthObj.getLinkObject(item.ClaimValue, tabName, linkName)
                        if (item.ClaimValue.toLowerCase() == "administrator") {
                            return false;
                        }
                    }
                });
            }
        }
        return curLink;
    },

    getLinkObject: function(ClaimRole, tabName, linkName) {
        var curLink = {
            "IsVisible": false
        };
        if (tabName && tabName.trim().length > 0 && linkName && linkName.trim().length > 0) {
            var curTab = AuthObj.getTabObject(ClaimRole, tabName);
            if (curTab && curTab.IsVisible) {
                var presentLink = AuthObj.getLinkPropertiesForLinkInTab(curTab, linkName);
                if (presentLink) {
                    return presentLink;
                }
            }
        }
        return curLink;
    },

    ButtonObject: function(tabName, linkName, buttonName) {
        var curButton = {
            "IsVisible": false
        };
        if (tabName && tabName.trim().length > 0 && linkName && linkName.trim().length > 0 && buttonName && buttonName.trim().length > 0) {
            var lstClaimKeyValues = AuthObj.getClaimTypeValuesForActiveModule();
            if (lstClaimKeyValues) {
                $.each(lstClaimKeyValues, function(pos, item) {
                    if (item && item.ClaimValue) {
                        curButton = AuthObj.getButtonObject(item.ClaimValue, tabName, linkName, buttonName);
                        if (item.ClaimValue.toLowerCase() == "administrator") {
                            return false;
                        }
                    }
                });
            }
        }
        return curButton;
    },

    getButtonObject: function(ClaimRole, tabName, linkName, buttonName) {
        var curButton = {
            "IsVisible": false
        };
        var curLink = AuthObj.getLinkObject(ClaimRole, tabName, linkName);
        if (curLink && curLink.IsVisible) {
            var presentButton = AuthObj.getButtonPropertiesForAButtonInLink(curLink, buttonName);
            if (presentButton) {
                return presentButton;
            }
        }
        return curButton;
    },



    getClaimTypeValuesForActiveModule: function() {
        var lstClaimTypeValues;
        if (typeof app !== "undefined") {
            var moduleName = app.info.getActive().toJSON().name;
            lstClaimTypeValues = AuthObj.getClaimTypeValuesForModule(moduleName)
        }
        return lstClaimTypeValues;
    },


    getClaimTypeValuesForModule: function(moduleName) {
        var lstClaimTypeValues;
        if (typeof app !== "undefined" && moduleName) {
            var userAssignedClaims = app.user.toJSON().claims;
            if (userAssignedClaims) {
                lstClaimTypeValues = $.grep(userAssignedClaims, function(assignedClaims) {
                    if (assignedClaims.ClaimType.trim().toLowerCase() == moduleName.trim().toLowerCase())
                        return assignedClaims;
                });
            }
        }
        return lstClaimTypeValues;
    },

    getDefaultAllClaims: function() {
        var defaultClaims = app.AuthorizationProfiles.profiles.models[0].toJSON().securityClaims;
        return defaultClaims;
    },

    getAllModulesByClaimValue: function(ClaimRole) {
        var defaultClaims = AuthObj.getDefaultAllClaims();
        var allClaimsModules = _.find(defaultClaims, function(objClaims) {
            return ClaimRole.trim().toLowerCase() == objClaims.ClaimRole.trim().toLowerCase();
        });
        return allClaimsModules;
    },

    getModuleLevelPropertiesByModule: function(allclaimsModules) {
        var moduleName = app.info.getActive().toJSON().name;
        var specificModule = _.find(allclaimsModules.modules, function(objModules) {
            return objModules.Module.trim().toLowerCase() == moduleName.trim().toLowerCase();
        });
        return specificModule;
    },

    getTabPropertiesForATabInModule: function(curModule, tabname) {
        var specificTab = _.find(curModule.Tabs, function(objTabs) {
            return objTabs.name.trim().toLowerCase() == tabname.trim().toLowerCase();
        });
        return specificTab;
    },

    getLinkPropertiesForLinkInTab: function(curTab, linkName) {
        var specificLink = _.find(curTab.Links, function(objLinks) {
            return objLinks.name.trim().toLowerCase() == linkName.trim().toLowerCase();
        });
        return specificLink;
    },

    getButtonPropertiesForAButtonInLink: function(curLink, buttonName) {
        var specificButton = _.find(curLink.Buttons, function(objButtons) {
            return objButtons.name.trim().toLowerCase() == buttonName.trim().toLowerCase();
        });
        return specificButton;
    },


    HavingProfile: function(moduleName, inputRole) {
        var lstClaimKeyValues = AuthObj.getClaimTypeValuesForModule(moduleName);
        if (lstClaimKeyValues) {
            var inputRoleObject = _.find(lstClaimKeyValues, function(objClaimKeyValues) {
                return objClaimKeyValues.ClaimValue.trim().toLowerCase() == inputRole.trim().toLowerCase();
            });
            if (inputRoleObject)
                return true;
        }
        return false;

    }
};


/* Assume that if multiple levels (module �tab � tab �link � button�) are there. � max levels are four only..
 * example - User Manager module -> user manager (tab) -->
 * and again if Add user option (consider this as a tab).. instead of link..
 * as if the main tab is visible then only sub tabs are visible otherwise not..
 * instead of considering this as a link - consider this as tab - to improve the performance....
 * For this, any module should not have the same tab name more than once � i.e., tab name is unique under any module.
 * if mulitple tabs are there and using same options then - should not consider all options as tabs -- example: service complete tab and service tab has edit member option
 * then consider edit member as link.- use it effectively.
 
 * considered the userprofiel guide_V2 is the base for creating the authorization claims..
 * taking names of the modules / tabs/links from this document itself and where ever
 * if we observe forward slash - replaced with underscore - Example: link: view/confirm request --> view_confirm request.
 */