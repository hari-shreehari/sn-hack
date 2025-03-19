// cust_add
// post

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var params = request.body.nextEntry();
    var actionInputs = JSON.parse(params.actionInputs);
    var table = "u_xhelios_customer";

    // Extract required fields from actionInputs
    var custName = actionInputs.u_cust_name;
    var custMail = actionInputs.u_cust_mail;

    // Validate required fields
    if (gs.nil(custName) || gs.nil(custMail)) {
        response.setStatus(400);
        return response.setBody({ error: "Missing required fields" });
    }

    // Insert the record into the table
    var gr = new GlideRecord(table);
    gr.initialize();
    gr.u_cust_name = custName;
    gr.u_cust_mail = custMail;
    var sys_id = gr.insert();

    // Respond based on insert success/failure
    if (sys_id) {
        response.setStatus(201);
        response.setBody({ message: "Customer added successfully", sys_id: sys_id });
    } else {
        response.setStatus(500);
        response.setBody({ error: "Failed to insert customer" });
    }

})(request, response);
