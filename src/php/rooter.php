<?php
$url = (key_exists('REQUEST_URI',$_SERVER)) ? $_SERVER['REQUEST_URI'] : "";
$pos = strpos($url, "?");
if ($pos !== false) {
    $url = substr($url, 0, $pos);
}
if ($url == "" || $url == "/") {
    include 'pages/home.php';
} else {
    include 'pages'.$url.'.php';
}