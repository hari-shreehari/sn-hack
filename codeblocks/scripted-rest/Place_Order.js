//place_order
//post

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var params = request.body.nextEntry();
    var actionInputs = JSON.parse(params.actionInputs);
    var orderTable = "u_xhelios_orders";
    var productTable = "u_xhelios_products";

    var custId = actionInputs.u_cust_id;
    var prodId = actionInputs.u_prod_id;

    if (gs.nil(custId) || gs.nil(prodId)) {
        response.setStatus(400);
        return response.setBody({ error: "Missing required fields: u_cust_id or u_prod_id" });
    }

    var grProduct = new GlideRecord(productTable);
    grProduct.addQuery("u_number", prodId);
    grProduct.query();

    if (grProduct.next()) {
        if (grProduct.u_available_stock > 0) {
            // Reduce stock and update
            grProduct.u_available_stock -= 1;
            grProduct.update();

            // Create order only if stock is available
            var grOrder = new GlideRecord(orderTable);
            grOrder.initialize();
            grOrder.u_order_date = new GlideDateTime();
            grOrder.u_feedback = "None"; 
            grOrder.u_cust_id = custId;
            grOrder.u_prod_id = prodId;

            var sys_id = grOrder.insert();
            gs.info("Order insert sys_id: " + sys_id); // Debugging log

            if (!sys_id) {
                gs.info("Order insert failed!");  // Debugging log
                response.setStatus(500);
                return response.setBody({ error: "Failed to create order" });
            }

            if (grProduct.u_available_stock <= grProduct.u_alarm_quantity) {
                response.setStatus(200);
                return response.setBody({ message: "Stock below alarm quantity", valid: true });
            }

            response.setStatus(201);
            return response.setBody({ message: "Order placed successfully", sys_id: sys_id });

        } else {
            response.setStatus(400);
            return response.setBody({ message: "Product out of stock" });
        }
    } else {
        response.setStatus(404);
        return response.setBody({ message: "Product not found" });
    }

})(request, response);
