//vendor_sold
//get

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var orderTable = "u_xhelios_orders";
    var productTable = "u_xhelios_products";

    var vendorSales = {};

    var grOrders = new GlideAggregate(orderTable);
    grOrders.addAggregate("COUNT", "u_prod_id");
    grOrders.groupBy("u_prod_id");
    grOrders.query();

    while (grOrders.next()) {
        var prodId = grOrders.u_prod_id.toString();
        var prodCount = grOrders.getAggregate("COUNT", "u_prod_id");

        var grProduct = new GlideRecord(productTable);
        grProduct.addQuery("u_number", prodId);
        grProduct.query();

        if (grProduct.next()) {
            var vendorId = grProduct.u_sold_by.toString();
            if (!vendorSales[vendorId]) {
                vendorSales[vendorId] = 0;
            }
            vendorSales[vendorId] += parseInt(prodCount, 10);
        }
    }

    response.setStatus(200);
    response.setBody({ message: "Vendor sales data retrieved", data: vendorSales });

})(request, response);
