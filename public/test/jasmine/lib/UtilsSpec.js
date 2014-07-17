define(['lib/util', 'moment'], function(Utils, Moment) {
 
  return describe('Library :: Utils', function() {

  	beforeEach(function () {
      this.utils = new Utils();
      this.passed = true;

      // For testing dates, we want to hit a swath of dates, as date validation might break for one date but not another.
      // Here we are setting up an array of dates starting at 4/13/1980 and incrementing each array entry by 3 minutes
      // This could be further optimized for testing by increasing the range and altering the increment so it hits different
      // second values,  but none of the functions below utilize seconds.
      // It is probably also better not to do this in the beforeEach, but it doesnt seem to be affecting the speed of the test.
      this.dates = [];
      var timestamp = 324446400000;
      while(timestamp < 324532800000){
      	this.dates.push(new Date(timestamp));
      	timestamp += 180000;
      }

    });

    it("this.formatDate should return a properly formatted date string as 'mm/dd/yy'", function() {
    	var regex = new RegExp(/\d{1,2}\/\d{1,2}\/\d{2}/);
    	for(var d = 0; d < this.dates.length; d++){
    		if(!regex.test(this.utils.formatDate(this.dates[d]))){
				this.passed = false;
				console.log("Library : Utils - formatDate regex test failed validating against " + this.dates[d].valueOf())
    		}
    	}
    	expect(this.passed).toBe(true)
    });

    it("this.formatTime should return a properly formatted time string as 'hh:mm AM/PM'", function() {
    	var regex = new RegExp(/[1-9]?[0-9]:[0-9][0-9]\sAM|PM/);
    	for(var d = 0; d < this.dates.length; d++){
    		if(!regex.test(this.utils.formatTime(this.dates[d]))){
				this.passed = false;
				console.log("Library : Utils - formatTime regex test failed validating against " + this.dates[d].valueOf())
    		}
    	}
    	expect(this.passed).toBe(true)
    });

    it("this.hoursMinutes should return a date difference as 'hh:mm (hh:mm)'", function() {
    	
    });

  });
});
 