//remove-cart
//post

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var params = request.body.data;

        var custId = params.u_cust_id;
        var prodId = params.u_prod_id;

        if (gs.nil(custId) || gs.nil(prodId)) {
            response.setStatus(400);
            return response.setBody({ error: "Missing required fields: u_cust_id or u_prod_id" });
        }

        var grOrder = new GlideRecord("u_xhelios_orders");
        grOrder.addQuery("u_cust_id", custId);
        grOrder.addQuery("u_prod_id", prodId);
        grOrder.addQuery("u_status", "In-Cart"); // Ensure only "In-Cart" items are removed
        grOrder.query();

        if (grOrder.next()) {
            grOrder.deleteRecord();
            response.setStatus(200);
            return response.setBody({ message: "Item removed from cart successfully" });
        } else {
            response.setStatus(404);
            return response.setBody({ error: "No matching item found in cart" });
        }

    } catch (e) {
        response.setStatus(500);
        response.setBody({ error: "Error processing request: " + e.message });
    }
})(request, response);

