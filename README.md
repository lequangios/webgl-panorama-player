# WebGL Panorama Player
Simple WebGL Player help you display your panorama picture on your website


## 1 What is Panorama picture ?

Panoramic photography is a technique of photography, using specialized equipment or software, that captures images with horizontally elongated fields of view. It is sometimes known as wide format photography. The term has also been applied to a photograph that is cropped to a relatively wide aspect ratio, like the familiar letterbox format in wide-screen video. 

## 2 How to use this source ?

`-` Import file Panorama.js to your project

`-` Initialize and start player :

~~~js
var canvas = document.getElementById("canvas");
var titleArr = ["img/pano1.jpg","img/pano2.jpg","img/pano3.jpg","img/pano4.jpg","img/pano5.jpg","img/pano6.jpg"];

var pl = new Panorama.player();
pl.initPanorama(canvas, titleArr, []);
~~~  

## 3 Demo project ?

You can preview demo [here](https://mobilecodelab.com/demo/paronama/)

