api.controller = function ($scope, $http) {
  var c = this;
  $scope.loading = true;

  $scope.recommendedProducts = [];

  function getRecommendations() {
    $http
      .post("https://sn-hack.vercel.app/get_recommendations", {
        user_id: "CUST0001001",
      })
      .then(function (response) {
        if (response.data.recommended_products) {
          var recommendedIDs = response.data.recommended_products;
          $scope.recommendedProducts = $scope.data.products.filter(
            function (product) {
              return recommendedIDs.includes(product.id);
            }
          );
        }
      })
      .catch(function (error) {
        console.error("Error fetching recommendations:", error);
      })
      .finally(function () {
        $scope.loading = false;
      });
  }

  getRecommendations();

  c.addToCart = function (productId) {
        var cartData = {
            actionInputs: JSON.stringify({
                u_cust_id: "CUST0001001", // Customer ID (change dynamically if needed)
                u_prod_id: productId, // Product ID of clicked product
            }),
        };

        $http.post("/api/snc/xhelios/add_to_cart", cartData).then(
            function (response) {
                if (response.status === 201) {
                    alert("Product added to cart successfully! Cart ID: " + response.data.sys_id);
                } else {
                    alert("Failed to add product to cart.");
                }
            },
            function (error) {
                alert("Error adding product to cart: " + error.data.error);
            }
        );
    };
};
