/* global define, kb, $, app */
/**
 * A module representing a jacket.
 * @module Utils
 */
define([
    'underscore',
    'backbone',
], function(_, Backbone) {
    "use strict";
    /**
     * @constructor
     * @alias Utils
     */
    var Utils = function() {

        /**
         * Returns an object representing form values
         * @returns {Object} - Key/Value pair object representing form values
         * @param {Object} - jQuery object for the form to convert
         * @param {Boolean} [wc3=false] - If true, function will return only 'successful' form elements.  By default,
         * function will return all checkboxes as true/false (as opposed to wc3 standard of checked boxes as 'on')
         */
        this.getForm = function(form, wc3) {
            var array = form.serializeArray();
            var o = {};
            for (var i = 0; i < array.length; i++) {
                if (o[array[i].name] !== undefined) {
                    if (!o[array[i].name].push) {
                        o[array[i].name] = [o[array[i].name]];
                    }
                    o[array[i].name].push(array[i].value || '');
                } else {
                    o[array[i].name] = array[i].value || '';
                }
            }

            // Wc3 Standards indicate checkboxes that are NOT checked are not 'successful' form elements
            // However, in our use case, we want true/false to be associated with each checkbox
            if (!wc3) {
                // Get checkboxes (checkboxes that are not checked will be missing from serializeArray)
                $('input[type="checkbox"]:not(disabled)', form).each(function() {
                    var $this = $(this);
                    var name = $this.attr('name');
                    if (name) o[name] = ($this.is(':checked')) ? true : false;
                });
            }
            return o;
        };

        /**
         * Creates a backbone collection from a breeze collection and synchronizes the collection
         * to update when the corresponding breeze collection updates (one way sync).
         * @returns {Collection|CollectionObserveable} - Returns collection or a kb.collectionObserveable if observe argument is true
         * @param {Array} array - the Breeze array to track
         * @param {Boolean} observe - If true, function will return a kb.collectionObserveable
         */
        this.trackedBreezeCollection = function(array, observe) {

            var collection = new Backbone.Collection(array);

            if (array.arrayChanged) {
                array.arrayChanged.subscribe(
                    function(arrayChangedArgs) {
                        var addedEntities = arrayChangedArgs.added;
                        if (addedEntities) {
                            collection.add(addedEntities);
                        }
                        var removedEntities = arrayChangedArgs.removed;
                        if (removedEntities) collection.remove(removedEntities);
                    });
            }

            return (observe) ? kb.collectionObservable(collection) : collection;
        };

        /**
         * Application wide formatDate function.  Lets keep all dates the same format.
         * @param {object} date - Date object to be formatted
         * @returns {string} Formatted date string (mm/dd/yy).
         */
        this.formatDate = function(date) {
            return (date && date.getMonth) ? ((date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()) : "";
        };

        /**
         * Application wide formatTime function.  Lets keep time standard too.
         * @param {object} date - Date object to be formatted
         * @returns {string} - Formatted time string (hour:minutes ampm)
         */
        this.formatTime = function(date) {
            var hours = date.getUTCHours();
            var ampm, hour;
            if (hours >= 12) {
                ampm = "PM";
                hour = hours - 12;
                if (hour === 0) hour = 12;
            } else {
                ampm = "AM";
                hour = hours;
            }
            var minutes = date.getUTCMinutes();
            if (minutes < 10) minutes = '0' + minutes;
            return hour + ":" + minutes + " " + ampm;
        };

        /**
         * Helper for getting the difference in hours and minutes between two dates.
         * @param {object} date1 - A Moment date object to be compared against...
         * @param {object} date2 - A Moment date object to be compared against date1
         * @returns {string} A string displaying the difference (hh:mm (hh:mm))
         */
        this.hoursMinutes = function(date1, date2) {
            var diff = date2.diff(date1, 'minutes');
            var hours = Math.floor(diff / 60);
            var hours_string = (hours <= 9) ? "0" + hours : hours;
            var mins = diff % 60;
            var mins_string = (mins <= 9) ? "0" + mins : mins;
            return hours_string + ":" + mins_string + " (hh:mm)";
        };

        /**
         * DateTime formatting helper to format the DateTime object to any string format.
         *   @param {object} date - A DateTime object which holds the DataTime thet needs to be formatted.
         *   @param {string} formartExpression - A String format of the Expression that needs to be returned back to display on the Screen.
         *           Format of Data:<br />
         *               'MMMM Do YYYY, h:mm:ss a'   - April 30th 2014, 10:52:44 am<br />
         *               'dddd'                      - Wednesday<br />
         *               'MMM Do YY'                 - Apr 30th 14<br />
         *               'YYYY [escaped] YYYY'       - 2014 esacped 2014<br />
         *               'MM/DD/YYYY hh:mm:ss a'     - 03/30/2014 10:53:01 AM<br />
         *
         *               URL: http://momentjs.com/docs/
         */
        this.formatDateTime = function(date, formatExpression) {
            if (date) {
                var _dateString = (_.isDate(date) === true) ? date.toISOString() : date;
                var dateString = _dateString.replace("T", " ");
                if (!formatExpression) formatExpression = 'MM/DD/YYYY hh:mm:ss a';
                return app.moment(dateString).format(formatExpression);
            }
        };
                
        this.formatTimeDifference = function(diff){
            var hours = diff.get('hours') + '';
            if(hours.length < 2) hours = '0' + hours;
            var minutes = diff.get('minutes') + '';
            if(minutes.length < 2) minutes = '0' + minutes;
            
                return hours + ":" + minutes;
        };

    };

    return Utils;
});