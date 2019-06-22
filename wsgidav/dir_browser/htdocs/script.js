$("#upload-button").click(function() {
    var filedata = $("#upload-file")[0].files[0];

    var xhr = new window.XMLHttpRequest();
    xhr.open("PUT", filedata.name, true);

    xhr.upload.addEventListener("progress", function(evt) {
	var status = "";

	if (evt.lengthComputable) {
	    var percentComplete = evt.loaded / evt.total;
	    percentComplete = percentComplete * 100;
	    status = ": " + percentComplete.toFixed(3) + "%";

	    if (parseInt(percentComplete) == 100)
	    {
		status = " Successfully";

		$("#upload-button").removeClass("btn-primary");
		$("#upload-button").addClass("btn-success");

		setTimeout(function() {
		    document.location.reload();
		}, 300);
	    }

	    $("#upload-button").text("Upload" + status);
	}
    }, false);

    xhr.send(filedata);
});

$(".command-button").click(function() {
    var link = $(this).parent().parent().find("a").attr("href");
    var ext = link.match(/\.[a-zA-Z0-9]+$/); ext = ext ? ext[0] : null;

    $(".command-btn").each(function() {
        var required_ext = $(this).attr("data-ext");
        var href = $(this).attr("data-href");

        required_ext = required_ext.split(",");
        var enabled = required_ext.indexOf(ext) >= 0;

        $(this).attr("href", enabled ? href + "?" + $.param({"file": link}) : "#");
        $(this)[enabled ? "removeClass" : "addClass"]("disabled");
    });

    $("#command-title").text(decodeURIComponent(link));
    $("#command-dialog").modal();
});
