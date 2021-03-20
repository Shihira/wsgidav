$("#upload-button").click(function() {
    var filedata = $("#upload-file")[0].files[0];

    var xhr = new window.XMLHttpRequest();
    xhr.open("PUT", filedata.name, true);

    xhr.upload.onprogress = function(evt) {
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
                    location.reload();
                }, 300);
            }

            $("#upload-button").text("Upload" + status);
        }
    };

    xhr.send(filedata);
});

$("#download-button").click(function() {
    $.ajax({
        type: "POST",
        url: "http://" + location.host.replace(":8080", ":6800/jsonrpc"),
        data: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "aria2.addUri",
            "id": 1,
            "params": [[$("#download-uri").val()], {
                "dir": "/home/shihira/Public" + location.pathname,
                "pause": "true",
            }]
        }), 
        success: function() {
            location.href = location.origin + "/Pages/AriaNg.html#!/waiting";
        },
    });
});

$("#download-torrent-button").click(function() {
    var file_name = $(this).attr("data-file");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", file_name, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function() {

        var encodedBinary = btoa(String.fromCharCode.apply(null, new Uint8Array(this.response)));

        $.ajax({
            type: "POST",
            url: "http://" + location.host.replace(":8080", ":6800/jsonrpc"),
            data: JSON.stringify({
                "jsonrpc": "2.0",
                "method": "aria2.addTorrent",
                "id": 1,
                "params": [encodedBinary, [], {
                    "dir": "/home/shihira/Public" + location.pathname,
                    "pause": "true",
                }]
            }), 
            success: function() {
                location.href = location.origin + "/Pages/AriaNg.html#!/waiting";
            },
        });

    };
    xhr.send(); 
});

$("#move-button").click(function() {
    var file_name = $(this).attr("data-file");
    var move_to = $("#command-title").val().replace("\n", "");
    if (!confirm("Moving " + decodeURIComponent(file_name) + " to " + move_to))
        return;

    var xhr = new window.XMLHttpRequest();
    xhr.open("MOVE", file_name, true);
    xhr.onreadystatechange = function() { location.reload(); }
    xhr.setRequestHeader("Destination", encodeURIComponent(move_to));
    xhr.setRequestHeader("Depth", "infinity");
    xhr.send();
});

$("#delete-button").click(function() {
    var file_name = $(this).attr("data-file");
    if (!confirm("Deleting " + decodeURIComponent(file_name)))
        return;

    var xhr = new window.XMLHttpRequest();
    xhr.open("DELETE", file_name, true);
    xhr.onreadystatechange = function() { location.reload(); }
    xhr.send();
});

$(".command-button").click(function() {
    var link = $(this).parent().parent().find("a").attr("href");
    var ext = link.match(/\.[a-zA-Z0-9]+$/); ext = ext ? ext[0] : null;

    $(".command-btn").each(function() {
        var required_ext = $(this).attr("data-ext");

        required_ext = required_ext.split(",");
        var enabled = required_ext.indexOf(ext) >= 0;

        var href = $(this).attr("data-href");
        if (href)
            $(this).attr("href", enabled ? href + "?" + $.param({"file": link}) : "#");
        $(this)[enabled ? "removeClass" : "addClass"]("disabled");
    });

    $("#download-torrent-button").attr("data-file", link);
    $("#move-button").attr("data-file", link);
    $("#delete-button").attr("data-file", link);

    $("#command-title").val(decodeURIComponent(link));
    $("#command-dialog").modal();
});

