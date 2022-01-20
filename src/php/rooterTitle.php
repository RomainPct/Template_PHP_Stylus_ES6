<?php
$url = (key_exists('REQUEST_URI',$_SERVER)) ? $_SERVER['REQUEST_URI'] : "";
if ($url == "" || $url == "/") {
    echo "Home";
} else {
    echo ucfirst(substr($_SERVER['REQUEST_URI'],1));
}