api.controller = function() {
    var c = this;
    
    c.login = function() {
        if (c.username === 'admin' && c.password === 'admin') {
            window.location.href = 'https://mav-jan-2515-0006.lab.service-now.com/helios?id=analytics';
        } else if (c.username === 'customer' && c.password === 'customer') {
            window.location.href = 'https://mav-jan-2515-0006.lab.service-now.com/helios?id=customer';
        } else {
            c.errorMessage = "Invalid username or password!";
        }
    };
};

