api.controller = function() {
  var c = this;

  // Function to redirect to the cart page
  c.redirectToCart = function() {
    window.location.href = "https://mav-jan-2515-0006.lab.service-now.com/helios?id=cart";
  };
};

