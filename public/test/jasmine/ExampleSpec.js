define(['models/user'], function(User) {
 
  return describe('Model :: User', function() {

    var mockData = { 
      username: "Kitty",
      password: "Aa123456"
    };
 
    beforeEach(function () {
      this.user = new User(mockData);
    });

    it("should expose an attribute", function() {
      expect(this.user.get("username"))
        .toEqual("Kasdfsadfitty");
    });

    it("should be able to login the user", function(){
      // test login function


    });

    it("should fire a callback when 'foo' is triggered", function() {
      // Create an anonymous spy
      var spy = sinon.spy();
      
      // Call the anonymous spy method when 'foo' is triggered
      this.user.bind('foo', spy); 
      
      // Trigger the foo event
      this.user.trigger('foo'); 
      
      // Expect that the spy was called at least once
      expect(spy.called).toBeTruthy(); 
    });
 
 
  });
 
});




 