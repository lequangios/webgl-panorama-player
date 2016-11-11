/**
 * Created by levietquangt2@gmail.com on 11/11/16.
 */

var Panorama = {version:"1.0", description:"Simple WebGL Panorama, without hotspot", date:"11/11/16"};
Panorama.glMatrixArrayType = "undefined" != typeof Float32Array ? Float32Array : "undefined" != typeof WebGLFloatArray ? WebGLFloatArray : Array;

Panorama.identityMatrix = function(h)
{
    h[0]  = 1; h[1]  = 0; h[2]  = 0; h[3]  = 0;
    h[4]  = 0; h[5]  = 1; h[6]  = 0; h[7]  = 0;
    h[8]  = 0; h[9]  = 0;h[10]  = 1; h[11] = 0;
    h[12] = 0; h[13] = 0; h[14] = 0; h[15] = 1
};

Panorama.getPositionInPano = function (e) {
    if(e.pageX)
    {
        return {x:e.pageX, y:e.pageY};
    }
    else
    {
        return {x:e.changedTouches[0].pageX, y:e.changedTouches[0].pageY };
    }
};

Panorama.getCanvasOffset = function (canvas) {
    if(canvas == null) return {x:0,y:0};
    else
    {
        var ele = canvas.parentElement;
        var p = Panorama.getCanvasOffset(ele);
        p.x += canvas.offsetLeft;
        p.y += canvas.offsetTop;
        return p;
    }
};

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

Panorama.cameraLookAt = function(mat, alpha, vector) {

    var mat_out, vtx = vector[0], vty = vector[1];
    var vtz = vector[2], length = Math.sqrt(vtx * vtx + vty * vty + vtz * vtz);

    if (length) {
        1 != length && (length = 1 / length, vtx *= length, vty *= length, vtz *= length);
        var sina = Math.sin(alpha),
            cosa = Math.cos(alpha),
            mat0 = mat[0];
        mat1 = mat[1],
            mat2 = mat[2],
            mat3 = mat[3],
            mat4 = mat[4],
            mat5 = mat[5],
            mat6 = mat[6],
            mat7 = mat[7],
            mat8 = mat[8],
            mat9 = mat[9],
            mat10 = mat[10],
            mat11 = mat[11],
            t0 = vtx * vtx * (1 - cosa) + cosa,
            t1 = vty * vtx * (1 - cosa) + vtz * sina,
            t2 = vtz * vtx * (1 - cosa) - vty * sina,
            t3 = vtx * vty * (1 - cosa) - vtz * sina,
            t4 = vty * vty * (1 - cosa) + cosa,
            t5 = vtz * vty * (1 - cosa) + vtx * sina,
            t6 = vtx * vtz * (1 - cosa) + vty * sina,
            t7 = vty * vtz * (1 - cosa) - vtx * sina,
            t8 = vtz * vtz * (1 - cosa) + cosa;

        mat_out ? mat != mat_out && (mat_out[12] = mat[12], mat_out[13] = mat[13], mat_out[14] = mat[14], mat_out[15] = mat[15]) : mat_out = mat;
        mat_out[0] = mat0 * t0 + mat4 * t1 + mat8 * t2;
        mat_out[1] = mat1 * t0 + mat5 * t1 + mat9 * t2;
        mat_out[2] = mat2 * t0 + mat6 * t1 + mat10 * t2;
        mat_out[3] = mat3 * t0 + mat7 * t1 + mat11 * t2;
        mat_out[4] = mat0 * t3 + mat4 * t4 + mat8 * t5;
        mat_out[5] = mat1 * t3 + mat5 * t4 + mat9 * t5;
        mat_out[6] = mat2 * t3 + mat6 * t4 + mat10 * t5;
        mat_out[7] = mat3 * t3 + mat7 * t4 + mat11 * t5;
        mat_out[8] = mat0 * t6 + mat4 * t7 + mat8 * t8;
        mat_out[9] = mat1 * t6 + mat5 * t7 + mat9 * t8;
        mat_out[10] = mat2 * t6 + mat6 * t7 + mat10 * t8;
        mat_out[11] = mat3 * t6 + mat7 * t7 + mat11 * t8;
    }
};

Panorama.texture = function()
{
    this.webGLTexture = null;
    this.imgObj = null;
    this.preImgObj = null;
    this.isLoad = false;
};

Panorama.program = function()
{
    this.webGLProgram = null;
    this.vertexPosition = null;
    this.textureCoord = null;
    this.uPMatrix = null;
    this.uMVMatrix = null;
    this.uSampler = null;
};

Panorama.player = function()
{
    var player = this;

    // Private Variable
    var tileSize = 1024;
    var tileScale = 1.01;

    var verticesBuffer1 = null;
    var verticesBuffer2 = null;
    var verticesBuffer3 = null;

    // Private function
    function createWebGLContext() {
        if(player.canvas != null)
        {
            try
            {
                player.ctx = player.canvas.getContext("experimental-webgl",{"antialias":true}) || player.canvas.getContext("webgl",{"antialias":true});
            }
            catch (e)
            {
                player.ctx = null;
                var message = "Error creating WebGL Context!: " + e.toString();
                throw Error(message);
            }
        }
    }

    function setupWebGLViewPort() {
        if(player.ctx == null) return;

        player.ctx.viewport(0,0, player.canvas.width, player.canvas.height);
        player.ctx.width = player.canvas.width;
        player.ctx.height = player.canvas.height;
    }

    function createWebGLTexture()
    {
        for (var i = 0; i < 6; i++)
        {
            var t_Obj = new Panorama.texture();
            t_Obj.webGLTexture = player.ctx.createTexture();

            player.ctx.bindTexture(player.ctx.TEXTURE_2D, t_Obj.webGLTexture);
            player.ctx.texImage2D(player.ctx.TEXTURE_2D, 0, player.ctx.RGB, 1, 1, 0, player.ctx.RGB, player.ctx.UNSIGNED_BYTE, null);
            player.ctx.texParameteri(player.ctx.TEXTURE_2D, player.ctx.TEXTURE_MIN_FILTER, player.ctx.LINEAR);
            player.ctx.texParameteri(player.ctx.TEXTURE_2D, player.ctx.TEXTURE_WRAP_S, player.ctx.CLAMP_TO_EDGE);
            player.ctx.texParameteri(player.ctx.TEXTURE_2D, player.ctx.TEXTURE_WRAP_T, player.ctx.CLAMP_TO_EDGE);

            if(player.preTileSrcArray[i]){
                t_Obj.preImgObj = new Image();
                t_Obj.preImgObj.crossOrigin = "anonymous";
                t_Obj.preImgObj.addEventListener && t_Obj.preImgObj.addEventListener("load", imageTextureLoaded(t_Obj), false);
                t_Obj.preImgObj.src = player.preTileSrcArray[i];

            }

            if(player.tileSrcArray[i]){
                t_Obj.imgObj = new Image();
                t_Obj.imgObj.crossOrigin = "anonymous";
                t_Obj.imgObj.addEventListener && t_Obj.imgObj.addEventListener("load", imageTextureLoaded(t_Obj), false);
                t_Obj.imgObj.src = player.tileSrcArray[i];
            }

            player.textureArray.push(t_Obj);

            player.ctx.bindTexture(player.ctx.TEXTURE_2D, null);
        }
    }

    function imageTextureLoaded(obj)
    {
        return function (){
            player.ctx.pixelStorei(player.ctx.UNPACK_FLIP_Y_WEBGL, true);
            var isHasTexture = false;

            if (obj.imgObj != null && obj.imgObj.complete) {
                if (!obj.isLoad) {
                    player.ctx.bindTexture(player.ctx.TEXTURE_2D, obj.webGLTexture);
                    player.ctx.texImage2D(player.ctx.TEXTURE_2D, 0, player.ctx.RGBA, player.ctx.RGBA, player.ctx.UNSIGNED_BYTE, obj.imgObj);
                    isHasTexture = obj.isLoad = true;
                }
            }
            else {
                if (obj.preImgObj != null && obj.preImgObj.complete) {
                    player.ctx.bindTexture(player.ctx.TEXTURE_2D, obj.webGLTexture);
                    player.ctx.texImage2D(player.ctx.TEXTURE_2D, 0, player.ctx.RGBA, player.ctx.RGBA, player.ctx.UNSIGNED_BYTE, obj.preImgObj);
                    isHasTexture = true;
                }
            }

            if (isHasTexture) {
                player.ctx.texParameteri(player.ctx.TEXTURE_2D, player.ctx.TEXTURE_MAG_FILTER, player.ctx.LINEAR);
                player.ctx.texParameteri(player.ctx.TEXTURE_2D, player.ctx.TEXTURE_MIN_FILTER, player.ctx.LINEAR);

                player.ctx.texParameteri(player.ctx.TEXTURE_2D, player.ctx.TEXTURE_WRAP_S, player.ctx.CLAMP_TO_EDGE);
                player.ctx.texParameteri(player.ctx.TEXTURE_2D, player.ctx.TEXTURE_WRAP_T, player.ctx.CLAMP_TO_EDGE);
            }
            player.ctx.bindTexture(player.ctx.TEXTURE_2D, null);

        };
    }

    function createWebGLBuffer(size){
        // size = 1/size;
        verticesBuffer1 = player.ctx.createBuffer();
        player.ctx.bindBuffer(player.ctx.ARRAY_BUFFER, verticesBuffer1);
        vertices = [-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1];
        for (var i = 0; 12 > i; i++) 2 > i % 3 && (vertices[i] *= size);
        player.ctx.bufferData(player.ctx.ARRAY_BUFFER, new Float32Array(vertices), player.ctx.STATIC_DRAW);

        verticesBuffer2 = player.ctx.createBuffer();
        player.ctx.bindBuffer(player.ctx.ARRAY_BUFFER, verticesBuffer2);
        player.ctx.bufferData(player.ctx.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 0, 1, 1, 1]), player.ctx.STATIC_DRAW);

        verticesBuffer3 = player.ctx.createBuffer();
        player.ctx.bindBuffer(player.ctx.ELEMENT_ARRAY_BUFFER, verticesBuffer3);
        player.ctx.bufferData(player.ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), player.ctx.STATIC_DRAW);
    };

    function createWebGLShader(){
        player.ctx.clearColor(255.0, 0, 0, 0);
        player.ctx.enable(player.ctx.DEPTH_TEST);
        player.ctx.clear(player.ctx.COLOR_BUFFER_BIT | player.ctx.DEPTH_BUFFER_BIT);
        player.ctx.enable(player.ctx.TEXTURE_2D);

        var fsh = player.ctx.createShader(player.ctx.FRAGMENT_SHADER);
        var str = "#ifdef GL_ES\n";
        str += "precision highp float;\n";
        str += "#endif\n";
        str += "varying vec2 vTextureCoord;\n";
        str += "uniform sampler2D uSampler;\n";
        str += "void main(void) {\n";
        str += "    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n";
        str += "}\n";
        player.ctx.shaderSource(fsh, str);
        player.ctx.compileShader(fsh);
        player.ctx.getShaderParameter(fsh, player.ctx.COMPILE_STATUS) || (alert(player.ctx.getShaderInfoLog(fsh)), fsh = null);

        var vsh = player.ctx.createShader(player.ctx.VERTEX_SHADER);
        str = "attribute vec3 aVertexPosition;\n";
        str += "attribute vec2 aTextureCoord;\n";
        str += "uniform mat4 uMVMatrix;\n";
        str += "uniform mat4 uPMatrix;\n";
        str += "varying vec2 vTextureCoord;\n";
        str += "void main(void) {\n";
        str += "    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n";
        str += "    vTextureCoord = aTextureCoord;\n";
        str += "}\n";
        player.ctx.shaderSource(vsh, str);
        player.ctx.compileShader(vsh);
        player.ctx.getShaderParameter(vsh, player.ctx.COMPILE_STATUS) || (alert(player.ctx.getShaderInfoLog(vsh)), vsh = null);

        player.panoProgram = new Panorama.program();
        player.panoProgram.webGLProgram = player.ctx.createProgram();
        player.ctx.attachShader(player.panoProgram.webGLProgram, vsh);
        player.ctx.attachShader(player.panoProgram.webGLProgram, fsh);
        player.ctx.linkProgram(player.panoProgram.webGLProgram);
        player.ctx.getProgramParameter(player.panoProgram.webGLProgram, player.ctx.LINK_STATUS) || alert("Could not initialise shaders");
        player.ctx.useProgram(player.panoProgram.webGLProgram);

        player.panoProgram.vertexPosition = player.ctx.getAttribLocation(player.panoProgram.webGLProgram, "aVertexPosition");
        player.ctx.enableVertexAttribArray(player.panoProgram.vertexPosition);

        player.panoProgram.textureCoord = player.ctx.getAttribLocation(player.panoProgram.webGLProgram, "aTextureCoord");
        player.ctx.enableVertexAttribArray(player.panoProgram.textureCoord);

        player.panoProgram.uPMatrix = player.ctx.getUniformLocation(player.panoProgram.webGLProgram, "uPMatrix");
        player.panoProgram.uMVMatrix = player.ctx.getUniformLocation(player.panoProgram.webGLProgram, "uMVMatrix");
        player.panoProgram.uSampler = player.ctx.getUniformLocation(player.panoProgram.webGLProgram, "uSampler");

        createWebGLBuffer(tileScale);
        createWebGLTexture();
    };

    function calcPositionView(delX, delY) {
        player.span += delX;
        player.tilt -= delY;

        if(player.span <= 0) player.span = 360 + player.span;
        if(player.span >= 360) player.span -= 360;

        if(player.tilt <= player.minTilt) player.tilt = player.minTilt;
        if(player.tilt >= player.maxTilt) player.tilt = player.maxTilt;
    };

    // Public Variable
    this.tileSrcArray = null;
    this.preTileSrcArray = null;
    this.textureArray = [];

    this.ctx = null;
    this.canvas = null;
    this.panoProgram = null;
    this.viewMatrix = new Panorama.glMatrixArrayType(16);
    this.pMatrix = new Panorama.glMatrixArrayType(16);
    this.panoPosition = null;
    this.curFov = 70;
    this.curVFov = 0;
    this.minFov = 0;
    this.maxFov = 180;
    this.minVFov = 0;
    this.maxVFov = 0;
    this.maxTilt = 90;
    this.minTilt = -90;
    this.vWidth = 1024;
    this.vHeight = 768;
    this.fovMode = 1;
    this.span = 321;
    this.tilt = -3;
    this.isMouseDown = false;
    this.isAccelerationMove = false;
    this.currentPos = null;

    // Public function
    this.update = function()
    {
        if(player.isMouseDown || player.isAccelerationMove) return;
        player.span += 0.1;
        if(player.span >= 360) player.span = 0;
    };

    this.rendered = function() {

        player.ctx.clear(player.ctx.COLOR_BUFFER_BIT | player.ctx.DEPTH_BUFFER_BIT);

        Panorama.identityMatrix(player.pMatrix);

        player.pMatrix[0]  = 1.0711109638214111;
        player.pMatrix[1]  = 0;
        player.pMatrix[2]  = 0;
        player.pMatrix[3]  = 0;
        player.pMatrix[4]  = 0;
        player.pMatrix[5]  = 1.4281480312347412;
        player.pMatrix[6]  = 0;
        player.pMatrix[7]  = 0;
        player.pMatrix[8]  = 0;
        player.pMatrix[9]  = 0;
        player.pMatrix[10] = -1.0010000467300415;
        player.pMatrix[11] = -1;
        player.pMatrix[12] = 0;
        player.pMatrix[13] = 0;
        player.pMatrix[14] = -0.20000000298023224;
        player.pMatrix[15] = 0;

        player.ctx.uniformMatrix4fv(player.panoProgram.uPMatrix, false, player.pMatrix);

        for (var i = 0; i < 6; i++) {
            Panorama.identityMatrix(player.viewMatrix);

            Panorama.cameraLookAt(player.viewMatrix, -player.tilt * Math.PI / 180, [1, 0, 0]);
            Panorama.cameraLookAt(player.viewMatrix, (180 - player.span) * Math.PI / 180, [0, 1, 0]);

            if (i < 4) {
                Panorama.cameraLookAt(player.viewMatrix, -Math.PI / 2 * i, [0, 1, 0]);
            }
            else {
                Panorama.cameraLookAt(player.viewMatrix, Math.PI / 2 * (5 == i ? 1 : -1), [1, 0, 0]);
            }

            player.ctx.bindBuffer(player.ctx.ARRAY_BUFFER, verticesBuffer1);
            player.ctx.vertexAttribPointer(player.panoProgram.vertexPosition, 3, player.ctx.FLOAT, false, 0, 0);

            player.ctx.bindBuffer(player.ctx.ARRAY_BUFFER, verticesBuffer2);
            player.ctx.vertexAttribPointer(player.panoProgram.textureCoord, 2, player.ctx.FLOAT, false, 0, 0);

            if (player.textureArray.length >= 6) {
                player.ctx.activeTexture(player.ctx.TEXTURE0);
                player.ctx.bindTexture(player.ctx.TEXTURE_2D, player.textureArray[i].webGLTexture);
                player.ctx.bindBuffer(player.ctx.ELEMENT_ARRAY_BUFFER, verticesBuffer3);

                player.ctx.uniform1i(player.panoProgram.uSampler, 0);
                player.ctx.uniformMatrix4fv(player.panoProgram.uMVMatrix, false, player.viewMatrix);
                player.ctx.uniformMatrix4fv(player.panoProgram.uPMatrix, false, player.pMatrix);

                player.ctx.drawElements(player.ctx.TRIANGLES, 6, player.ctx.UNSIGNED_SHORT, 0);
            }
        }

        player.update();

        requestAnimFrame(player.rendered, player.canvas);
    };

    this.initPanorama = function (canvas, titleArr, prevTitleArr) {
        player.canvas = canvas;
        player.tileSrcArray = titleArr;
        player.preTileSrcArray = prevTitleArr;
        player.vWidth = canvas.width;
        player.vHeight = canvas.height;

        player.panoAddEvent();
        player.startPanorama();
    };

    this.startPanorama = function ()
    {
        player.panoPosition = Panorama.getCanvasOffset(player.canvas);
        createWebGLContext();
        setupWebGLViewPort();
        createWebGLShader();

        player.rendered();
    };

    this.panoMouseDown = function (e) {
        e.preventDefault();
        player.isMouseDown = true;
        player.currentPos = Panorama.getPositionInPano(e);
    };

    this.panoMouseMove = function (e) {
        e.preventDefault();
        if(player.isMouseDown == true)
        {
            var nextPos = Panorama.getPositionInPano(e);
            var deltaX = 0.5*(nextPos.x - player.currentPos.x)*(360/player.vWidth);
            var deltaY = 0.5*(nextPos.y - player.currentPos.y)*(180/player.vHeight);

            calcPositionView(deltaX, deltaY);
            player.currentPos = nextPos;
        }
    };

    this.panoMouseUp = function (e) {
        player.isMouseDown = false;
    };

    this.panoAddEvent = function () {
        if(player.canvas != null) {
            player.canvas.addEventListener("mousedown",player.panoMouseDown,false);
            player.canvas.addEventListener("mousemove",player.panoMouseMove,false);
            player.canvas.addEventListener("mouseup",player.panoMouseUp,false);
        }
    };
};



