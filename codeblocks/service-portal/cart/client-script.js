api.controller = function ($scope, $http) {
    var c = this;
    $scope.cart = [];
		$scope.orders = [];
    $scope.total = 0;

    // Fetch orders for the customer
    function fetchOrders() {
        var orderData = {
            actionInputs: JSON.stringify({
                u_cust_id: "CUST0001001" // Default customer ID
            })
        };

        $http.post("/api/snc/xhelios/get-orders", orderData)
            .then(function (response) {
                if (response.data && response.data.result && response.data.result.orders) {
                    $scope.cart = response.data.result.orders.filter(x => x.status == "In-Cart");
                    $scope.orders = response.data.result.orders.filter(x => x.status != "In-Cart");
                  	//console.log($scope.cart);  
									//calculateTotal();
                } else {
                    console.warn("No orders found.");
                    $scope.cart = [];
                    $scope.total = 0;
                }
            })
            .catch(function (error) {
                console.error("Error fetching orders:", error);
                $scope.cart = [];
                $scope.total = 0;
            });
    }

    // Calculate cart total
    //function calculateTotal() {		
		//	$scope.cart.reduce((sum, product) => 
    //        sum + (parseFloat(product.u_price) || 0)
    //    , 0);
    //}

    // Checkout function
    $scope.checkout = function () {
        if ($scope.cart.length === 0) {
            alert("Cart is empty! Add products before checking out.");
            return;
        }
        alert("Proceeding to checkout. (Implementation needed)");
        // TODO: Implement API call to process the order checkout
    };

    // Initial fetch
    fetchOrders();
	
		$scope.buyNow = function(productId) {
			//alert("Buying product: " + productId);
			var orderData = {
				actionInputs: JSON.stringify({
					u_cust_id: "CUST0001001", // Default customer ID
					u_prod_id: productId // Product ID of clicked product
				})
			};

			// Call the place_order API
			$http.post('/api/snc/xhelios/place_order', orderData).then(function(response) {
				if(response.status === 200){
					$http.post("https://sn-hack.vercel.app/send_stock_alert", { product_id: productId }).then();
				}
				alert("Order placed successfully! Order ID: " + response.data.sys_id);
				location.reload(); // Refresh page to update stock
			}, function(error) {
				alert("Error placing order: " + error.data.message);
			});
		};

		$scope.removeFromCart = function(productId) {
			// Example: Remove the item from the front-end list.
			// TODO: Optionally, implement an API call to update the back end.
		};
};
