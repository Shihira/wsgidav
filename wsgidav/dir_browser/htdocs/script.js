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

    $("#command-cbz").attr("href", ext == ".cbz" ? "/Pages/ComicReader.html?" + $.param({"cbz": link}) : "#");
    $("#command-cbz")[ext == ".cbz" ? "removeClass" : "addClass"]("disabled");
    $("#command-md").attr("href", ext == ".md" ? "/Pages/Markdown.html?" + $.param({"md": link}) : "#");
    $("#command-md")[ext == ".md" ? "removeClass" : "addClass"]("disabled");

    $("#command-title").text(decodeURIComponent(link));
    $("#command-dialog").modal();
});
