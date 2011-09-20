<?php
setcookie("stest1", "This is the first cookie from the server.");
setcookie("stest2", "This is the second cookie from the server. (:&爱)");
/*
header( 'Pragma: no-cache' );
header("test");
flush();
die("<html>test\n");
*/
?>
<!doctype html>
<html>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<body>
<h3>Server-side:</h3>
<div>
<?php
echo "Server set cookie 1: " . (isset($_COOKIE['stest1']) ? $_COOKIE['stest1'] : "<i>Not set. Try refreshing.</i>") . '<br>';
echo "Server set cookie 2: " . (isset($_COOKIE['stest2']) ? $_COOKIE['stest2'] : "<i>Not set. Try refreshing.</i>") . '<br>';
echo "Client set cookie 1: " . (isset($_COOKIE['ctest1']) ? $_COOKIE['ctest1'] : "<i>Not set. Try refreshing.</i>") . '<br>';
echo "Client set cookie 2: " . (isset($_COOKIE['ctest2']) ? $_COOKIE['ctest2'] : "<i>Not set. Try refreshing.</i>");

?>
</div>
<h3>Client-side:</h3>
<div id=ctest></div>
</body>
<script>
function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

createCookie("ctest1", "This is the first cookie from the client.");
createCookie("ctest2", "This is the second cookie from the client.");

var ctest1 = readCookie("ctest1"),
    ctest2 = readCookie("ctest2"),
    stest1 = readCookie("stest1"),
    stest2 = readCookie("stest2");

document.getElementById("ctest").innerHTML += "<div>Server set cookie 1: " + (stest1 ? stest1 : "<i>Not set. Try refreshing.</i>") + "</div>";
document.getElementById("ctest").innerHTML += "<div>Server set cookie 2: " + (stest2 ? stest2 : "<i>Not set. Try refreshing.</i>") + "</div>";
document.getElementById("ctest").innerHTML += "<div>Client set cookie 1: " + (ctest1 ? ctest1 : "<i>Not set. Try refreshing.</i>") + "</div>";
document.getElementById("ctest").innerHTML += "<div>Client set cookie 2: " + (ctest2 ? ctest2 : "<i>Not set. Try refreshing.</i>") + "</div>";

</script>
</html>