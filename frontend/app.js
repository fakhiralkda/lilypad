document.getElementById("reqScript").style.display = "";
if (window.location.hash !== "") {document.getElementById("url").value = window.location.hash.substring(1); bypass();}

function bypass(na) {
    if (document.getElementById("loading").style.display == "") {return;}
    document.getElementById("success").style.display = "none";
    document.getElementById("fail").style.display = "none";
    document.getElementById("isCache").style.display = "none";
    document.getElementById("loading").style.display = "";
    var xhr = new XMLHttpRequest();
    var url = document.getElementById("url").value;
    url = btoa(url);
    url = encodeURIComponent(url);
    if (na == "1") {var u = "/api/bypass?url=" + url + "&ignoreArchive=true";} else {var u = "/api/bypass?url=" + url;}
    xhr.open("GET", u);
    xhr.send();
    xhr.onload = function () {
        var j = JSON.parse(xhr.responseText);
        if (j.success == true && j.url) {
            document.getElementById("success").style.display = "";
            document.getElementById("loading").style.display = "none";
            document.getElementById("link").href = j.url;
            document.getElementById("link").innerHTML = j.url;
            if (j.fromArchive == true) {
                document.getElementById("isCache").style.display = "";
            }
        } else {
            if (j.err.message == "Response code 403 (Forbidden)") {
                document.getElementById("errTxt").innerHTML = j.err.message + " <b>This may mean that our IP was blocked by the site.</b>";
            } else {
                document.getElementById("errTxt").innerHTML = j.err.message;
            }
            document.getElementById("fail").style.display = "";
            document.getElementById("loading").style.display = "none";
        }
    }
}