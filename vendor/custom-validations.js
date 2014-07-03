
// Custom Regex added by J.V. 4/2/2014
jQuery.validator.addMethod("alphanumericwithspaces", function(value, element) {
	return this.optional(element) || /^[\w\s]+$/i.test(value);
}, "Letters, numbers, spaces and underscores only please");

// Custom Regex added by J.V. 4/2/2014
jQuery.validator.addMethod("zipcodeUSandCanada", function(value, element) {
	return this.optional(element) || /^\d{5}-\d{4}$|^\d{5}$|^[A-Z]\d[A-Z][ ]\d[A-Z]\d$/.test(value);
}, "The specified US or Canadian ZIP Code is invalid");

/* Custom list box validation added by Praneeth. 
  Required Validation for Listbox works only if at least one record is highlighted/selected but in this case we just need to validate if the listbox contains at least one entry.*/
jQuery.validator.addMethod("listboxlength", function (value, element) {
    return element.length != 0;
}, "Please make sure at least one record is selected.");

/* Custom alphanumeric with special character validation added by Praneeth. */
jQuery.validator.addMethod("username", function (value, element) {
    return this.optional(element) || /^[a-zA-Z0-9].{3,50}$/.test(value);
}, "User Name cannot start with special characters and must be at least 4 characters.");

/* Password validation added by Ashok. */
//should contain at least one digit
//should contain at least one lower case
//should contain at least one upper case
//should contain at least 8 from the mentioned characters
jQuery.validator.addMethod("passwordformat", function (value, element) {
    return this.optional(element) || /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])$/.test(value);
}, "Password should contain atleast one digit, one lower case and one upper case.");

/* Custom alphanumeric with special character validation added by Ajay. */
jQuery.validator.addMethod("profilename", function (value, element) {
    return this.optional(element) || /^[a-zA-Z0-9].{3,50}$/.test(value);
}, "Profile Name cannot start with special characters and must be at least 4 characters.");

