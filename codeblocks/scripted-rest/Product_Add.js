//prod_add
//post

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var params = request.body.data;  // Correct way to get request body

        if (!params || !params.u_name || !params.u_sold_by) {
            response.setStatus(400);
            response.setBody({ error: "Missing required fields: u_name and u_sold_by are mandatory." });
            return;
        }

        var gr = new GlideRecord("u_xhelios_products");
        gr.initialize();
        gr.u_name = params.u_name;
        gr.u_sold_by = params.u_sold_by;
        gr.u_prod_description = params.u_prod_description || "";
        gr.u_available_stock = params.u_available_stock || 0;
        gr.u_alarm_quantity = params.u_alarm_quantity || 0;
        gr.u_image = params.u_image || "";  
        gr.u_price = params.u_price || 0;  // New field for product price

        var sys_id = gr.insert();

        if (sys_id) {
            response.setStatus(201);
            response.setBody({
                message: "Product added successfully",
                sys_id: sys_id,
                product_name: params.u_name,
                product_image: params.u_image,
                product_price: params.u_price
            });
        } else {
            response.setStatus(500);
            response.setBody({ error: "Failed to add product." });
        }
    } catch (e) {
        response.setStatus(500);
        response.setBody({ error: "Error processing request: " + e.message });
    }
})(request, response);

