(function() {
    var productTable = 'u_xhelios_products'; // Table name

    var gr = new GlideRecord(productTable);
    gr.query(); // Fetch all products

    data.products = [];

    while (gr.next()) {
        data.products.push({
            sys_id: gr.getUniqueValue(), // Unique sys_id
            name: gr.getValue('u_name'), // Product name
            id: gr.getValue('u_number'), // Product ID (Integer)
						description: gr.getValue('u_prod_description'), // Product description
            price: gr.getValue('u_price'), // Product price
            image_url: gr.getDisplayValue('u_image') // Retrieve the image dynamically
        });
    }
})();

