(function executeRule(current, gForm, gSNC) {
    var imageSysId = gForm.getValue('image'); // Get the uploaded image ID

    if (!imageSysId) {
        console.error("[Client Script] Error: No image selected.");
        alert("Error: Please upload an image before analyzing.");
        return;
    }

    var ga = new GlideAjax('ImageProcessor');
    ga.addParam('sysparm_name', 'processImage');
    ga.addParam('sysparm_imageSysId', imageSysId);

    ga.getXMLAnswer(function(response) {
        console.log("[Client Script] Server response:", response);
        if (!response || response.startsWith("Error")) {
            alert("❌ Analysis Failed: " + (response || "Unknown error occurred."));
        } else {
            alert("✅ AI Analysis Complete! Check results below.");
            var resultScope = angular.element(document.getElementById('aiResults')).scope();
            resultScope.$apply(function() {
                resultScope.c.analysisResult = JSON.parse(response);
            });
        }
    });
})();

