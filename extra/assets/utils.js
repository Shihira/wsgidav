function get_param(name) {
    var query_string = document.location.search.substr(1);
    var query_parameters = query_string.split('&');
    for (var i = 0; i < query_parameters.length; i++) {
        if (query_parameters[i].startsWith(name + "="))
            return decodeURIComponent(query_parameters[i].substring(name.length + 1));
    }
    return null;
}

function get_filename_without_extension(path) {
    var a = path.lastIndexOf("/");
    var b = path.lastIndexOf(".");
    a = a < 0 ? 0 : a + 1;
    b = b < 0 ? path.length : b;
    return path.substr(a, b - a);
}

