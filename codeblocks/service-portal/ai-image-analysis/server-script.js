var ImageProcessor = Class.create();
ImageProcessor.prototype = {
    initialize: function() {},

    processImage: function() {
        try {
            var imageSysId = this.getParameter('sysparm_imageSysId');
            if (!imageSysId) {
                gs.error("[ImageProcessor] No imageSysId received.");
                return "Error: No image ID provided.";
            }

            // Fetch image from sys_attachment
            var attachment = new GlideRecord('sys_attachment');
            attachment.addQuery('sys_id', imageSysId);
            attachment.query();

            if (!attachment.next()) {
                gs.error("[ImageProcessor] No image found for Sys ID: " + imageSysId);
                return "Error: Image not found.";
            }

            // Retrieve image data as Base64
            var fileData = new GlideSysAttachment().getBytes(attachment.sys_id);
            var base64Image = GlideStringUtil.base64Encode(fileData);

            // REST API Call to Hugging Face
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint("https://api-inference.huggingface.co/models/your-model-name");
            request.setHttpMethod("POST");
            request.setRequestHeader("Authorization", "Bearer YOUR_HUGGINGFACE_API_KEY");
            request.setRequestHeader("Content-Type", "application/json");

            var requestBody = JSON.stringify({ "inputs": base64Image });
            request.setRequestBody(requestBody);

            var response = request.execute();
            var responseBody = response.getBody();
            var httpStatus = response.getStatusCode();

            gs.info("[ImageProcessor] Hugging Face API Response: " + responseBody);

            if (httpStatus !== 200) {
                return "Error: AI Model failed. HTTP Status: " + httpStatus;
            }

            return responseBody; // Return AI results to the client script
        } catch (err) {
            gs.error("[ImageProcessor] Exception: " + err.message);
            return "Error: Internal Server Error.";
        }
    },

    type: 'ImageProcessor'
};

