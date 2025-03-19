(function () {
    var input = input.product;

    if (!input || !input.u_name || !input.u_sold_by) {
        data.success = false;
        data.error = "Missing required fields: Product Name and Sold By (Vendor ID) are mandatory.";
        return;
    }

    try {
        var gr = new GlideRecord('u_xhelios_products');
        gr.initialize();
        gr.u_name = input.u_name;
        gr.u_sold_by = input.u_sold_by;
        gr.u_prod_description = input.u_prod_description;
        gr.u_available_stock = input.u_available_stock;
        gr.u_alarm_quantity = input.u_alarm_quantity;

        if (input.u_image_url) {
            gr.u_image_url = input.u_image_url; // Use image URL, not base64
        }

        var inserted = gr.insert();
        
        if (inserted) {
            data.success = true;
            data.message = "Product added successfully!";
            data.sys_id = gr.sys_id; // Return the inserted sys_id
        } else {
            data.success = false;
            data.error = "Insert operation failed.";
        }
    } catch (e) {
        gs.log("Error in Product Insert: " + e.message, "xhelios");
        data.success = false;
        data.error = "An unexpected error occurred.";
    }
})();
