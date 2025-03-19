// add_to_cart
// post

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var params = request.body.nextEntry();
    var actionInputs = JSON.parse(params.actionInputs);
    var orderTable = "u_xhelios_orders";

    var custId = actionInputs.u_cust_id;
    var prodId = actionInputs.u_prod_id;

    if (gs.nil(custId) || gs.nil(prodId)) {
        response.setStatus(400);
        return response.setBody({ error: "Missing required fields: u_cust_id or u_prod_id" });
    }

    // Create an order with status "In-Cart"
    var grOrder = new GlideRecord(orderTable);
    grOrder.initialize();
    grOrder.u_order_date = new GlideDateTime();
    grOrder.u_feedback = "None"; 
    grOrder.u_cust_id = custId;
    grOrder.u_prod_id = prodId;
    grOrder.u_status = "In-Cart"; // Status set as "In-Cart"

    var sys_id = grOrder.insert();
    gs.info("Cart insert sys_id: " + sys_id); // Debugging log

    if (!sys_id) {
        gs.info("Cart insert failed!");  // Debugging log
        response.setStatus(500);
        return response.setBody({ error: "Failed to add product to cart" });
    }

    response.setStatus(201);
    return response.setBody({ message: "Product added to cart", sys_id: sys_id });

})(request, response);

