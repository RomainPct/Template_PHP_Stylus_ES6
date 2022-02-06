<?php
$url = (key_exists('REQUEST_URI',$_SERVER)) ? $_SERVER['REQUEST_URI'] : "";
$url = substr($url, 0, strpos($url, "?"));
if ($url == "" || $url == "/") {
    include_once 'pages/home.php';
} else {
    include_once 'pages'.$url.'.php';
}