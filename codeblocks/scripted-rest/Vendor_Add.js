//Vendor_Add
//post

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var params = request.body.nextEntry();
    var actionInputs = JSON.parse(params.actionInputs);
    var table = "u_xhelios_vendor";

    // Extract required fields from actionInputs
    var vendorName = actionInputs.u_vendor_name;
    var vendorMail = actionInputs.u_vendor_mail;

    // Validate required fields
    if (gs.nil(vendorName) || gs.nil(vendorMail)) {
        response.setStatus(400);
        return response.setBody({ error: "Missing required fields" });
    }

    // Insert the record into the table
    var gr = new GlideRecord(table);
    gr.initialize();
    gr.u_vendor_name = vendorName;
    gr.u_vendor_mail = vendorMail;
    var sys_id = gr.insert();

    // Respond based on insert success/failure
    if (sys_id) {
        response.setStatus(201);
        response.setBody({ message: "Vendor added successfully", sys_id: sys_id });
    } else {
        response.setStatus(500);
        response.setBody({ error: "Failed to insert vendor" });
    }

})(request, response);
