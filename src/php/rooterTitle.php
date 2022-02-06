<?php
$url = (key_exists('REQUEST_URI',$_SERVER)) ? $_SERVER['REQUEST_URI'] : "";
$url = substr($url, 0, strpos($url, "?"));
if ($url == "" || $url == "/") {
    echo "Home";
} else {
    echo ucfirst(substr($_SERVER['REQUEST_URI'],1));
}