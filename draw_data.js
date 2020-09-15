var canvas;
var gl;
var obj_program;
var attLoc;
var attStride;

// gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) / 1 - 1024
var pointSize = 5;

function glprep() {
  canvas = document.getElementById('glCanvas');
  gl = canvas.getContext('webgl');
  if (gl === null) {
    console.log('Unable to initialize WebGL.');
    return;
  }

  // init region
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // init shader
  var vec_shader = ShaderCompile(gl, 'VertexShader', gl.VERTEX_SHADER);
  var frag_shader = ShaderCompile(gl, 'FragmentShader', gl.FRAGMENT_SHADER);
  obj_program = ProgramLink(gl, vec_shader, frag_shader);
  attLoc = new Array();
  attLoc[0] = gl.getAttribLocation(obj_program, 'position');
  attLoc[1] = gl.getAttribLocation(obj_program, 'color');
  attStride = [ 3, 4 ];

  // register
  document.getElementById('draw').addEventListener('click', DrawPoints);
  document.getElementById('rot_cw').addEventListener('click', () => { mod_rot(-5); DrawPoints(); });
  document.getElementById('rot_ccw').addEventListener('click', () => { mod_rot(5); DrawPoints(); });
  document.getElementById('zoom_in').addEventListener('click', () => { mod_zoom(1.5); DrawPoints(); });
  document.getElementById('zoom_out').addEventListener('click', () => { mod_zoom(0.666); DrawPoints(); });
}
window.addEventListener('load', glprep);

function mod_rot(angle) {
  var c_angle = parseInt(document.getElementById('rot_value').value);
  document.getElementById('rot_value').value = c_angle + angle;
}
function mod_zoom(mul) {
  var c_zoom = Number(document.getElementById('zoom_value').value);
  console.log('cur: ' + c_zoom + ', mul: ' + mul);
  document.getElementById('zoom_value').value = Math.floor(c_zoom * mul * 100) / 100;
}

// test function
function DrawPoints() {
  // position array, (x, y, z) * n : [x1, y1, z1, x2, y2, z2, ...]
  var Points = [
      0.0, 1.0, 0.0,   1.0, 0.0, 0.0,   -1.0, 0.0, 0.0
//      0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 1.0, 
//      -1.0, 0.0, 0.0,  0.0, -1.0, 0.0,  0.0, 0.0, -1.0
  ];
  // color array, (r, g, b, a) * n : [r1, g1, b1, a1, r2, g2, b2, a2, ...]
  var Colors = [
      0.0, 1.0, 1.0, 1.0,   1.0, 0.0, 1.0, 1.0,   1.0, 1.0, 0.0, 1.0
//      0, 1, 0, 1,   1, 0, 0, 1.0,   1, 0, 0, 1,   0, 0, 1, 1,
//      0, 1, 0, 1,   1, 0, 0, 1.0,   1, 0, 0, 1 
  ];
  var vbo_pos = CreateVBO(gl, Points);
  var vbo_color = CreateVBO(gl, Colors);
  var uniLocation = new Array();
  uniLocation[0] = gl.getUniformLocation(obj_program, 'mvpMatrix');
  uniLocation[1] = gl.getUniformLocation(obj_program, 'pointSize');
  var matM = new Float32Array(16);
  var matV = new Float32Array(16);
  var matP = new Float32Array(16);
  var matMvp = new Float32Array(16);
  matM = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
  matV = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
  matP = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
  matMvp= [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // restart
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // projection
  var rot_angle = parseInt(document.getElementById('rot_value').value);
  var c_zoom = parseInt(document.getElementById('zoom_value').value);
  CalcSightDir([3.0, 3.0, 3.0], [0, 0, 0], [0, 1, 0], matV);
  // no rotate here
  CalcSightFov(100, canvas.width, canvas.height, 0.1, 100, matP);
//  ModelMove(matM, [1.0, 0.0, 2.0], matM);
  ModelRotate(matM, rot_angle, [0.0, 1.0, 0.0], matM);
  ModelScale(matM, [c_zoom, c_zoom, c_zoom], matM);
  MatMul4(matP, matV, matMvp);
  MatMul4(matMvp, matM, matMvp);

  // draw points by binding VBO
  BindVBO(gl, [vbo_pos, vbo_color], attLoc, attStride);
  gl.uniformMatrix4fv(uniLocation[0], false, matMvp);
  gl.uniform1f(uniLocation[1], pointSize);
  gl.drawArrays(gl.POINTS, 0, Points.length / 3);

  BindVBO(gl, [vbo_pos, vbo_color], attLoc, [3, 4]);
  gl.uniformMatrix4fv(uniLocation[0], false, matMvp);
  gl.drawArrays(gl.LINE_STRIP, 0, Points.length / 3);

  // show
  gl.flush();
  console.log('flushed');
}


