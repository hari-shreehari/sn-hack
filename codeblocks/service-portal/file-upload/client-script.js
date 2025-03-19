api.controller = function ($scope, $http) {
    var c = this;
    
    $scope.data = { product: {} };

    $scope.uploadProduct = function () {
        var fileInput = document.getElementById('fileInput');

        if (fileInput.files.length > 0) {
            var reader = new FileReader();
            reader.readAsDataURL(fileInput.files[0]);

            reader.onload = function () {
                var base64Data = reader.result.split(",")[1];

                // Upload image and get URL
                $http.post("https://snow-image.vercel.app/upload-image", { base64: base64Data })
                    .then(function (response) {
                        if (response.data.fileUrl) {
                            $scope.data.product.u_image = response.data.fileUrl;
                            console.log("Image uploaded:", response.data.fileUrl);
                            sendProductData();
                        } else {
                            $scope.data.error = "Image upload failed!";
                        }
                    })
                    .catch(function () {
                        $scope.data.error = "Error uploading image.";
                    });
            };

            reader.onerror = function () {
                $scope.data.error = "Error reading image file.";
            };
        } else {
            sendProductData();
        }
    };

    function sendProductData() {
        var productData = {
            u_name: $scope.data.product.u_name,
            u_sold_by: $scope.data.product.u_sold_by,
            u_prod_description: $scope.data.product.u_prod_description,
            u_available_stock: $scope.data.product.u_available_stock,
            u_alarm_quantity: $scope.data.product.u_alarm_quantity,
            u_price: $scope.data.product.u_price, // Added price field
            u_image: $scope.data.product.u_image || ""
        };

        console.log("Sending Product Data:", productData);

        $http.post("/api/snc/xhelios/prod_add", productData)
            .then(function (response) {
                console.log(response);
                if (response.data.result.sys_id) {
                    $scope.data.success = "Product added successfully!";
                    $scope.data.error = null;
                    console.log("Product Created:", response.data);
                } else {
                    $scope.data.error = response.data.error || "Failed to add product.";
                }
            })
            .catch(function () {
                $scope.data.error = "API request failed.";
            });
    }
};

