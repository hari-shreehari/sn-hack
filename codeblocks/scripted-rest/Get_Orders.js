// get-orders
// post

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var params = request.body.nextEntry();
    var actionInputs = JSON.parse(params.actionInputs);
    var custId = actionInputs.u_cust_id;
    
    if (gs.nil(custId)) {
        response.setStatus(400);
        return response.setBody({ error: "Missing required field: u_cust_id" });
    }

    var orderTable = "u_xhelios_orders";
    var productTable = "u_xhelios_products";
    
    var grOrders = new GlideRecord(orderTable);
    grOrders.addQuery("u_cust_id", custId);
    grOrders.query();

    var orderList = [];

    while (grOrders.next()) {
        var grProduct = new GlideRecord(productTable);
        grProduct.addQuery("u_number", grOrders.u_prod_id);
        grProduct.query();

        if (grProduct.next()) {
            orderList.push({
                order_id: grOrders.sys_id.toString(),
                product_id: grProduct.u_number.toString(),
                product_name: grProduct.u_name.toString(),
                sold_by: grProduct.u_sold_by.toString(),
                description: grProduct.u_prod_description.toString(),
                stock: grProduct.u_available_stock.toString(),
                alarm_quantity: grProduct.u_alarm_quantity.toString(),
                image_url: grProduct.u_image.toString(),
                status: grOrders.u_status.toString(),
                order_date: grOrders.u_order_date.toString()
            });
        }
    }

    if (orderList.length > 0) {
        response.setStatus(200);
        return response.setBody({ message: "Orders retrieved successfully", orders: orderList });
    } else {
        response.setStatus(404);
        return response.setBody({ message: "No orders found for this customer" });
    }

})(request, response);

