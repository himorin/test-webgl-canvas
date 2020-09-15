// WebGL and 3D related functions

// ShaderCompile: compile shader code block
// ProgramLink: Link vertex and fragment to program
// CreateVBO: init VBO
// BindVBO: attach VBO

// View related
//   CalcSightDir: camera position and direction
//   CalcSightFov: camera view - size, aspect, cut

// Model operation
//   ModelScale: scale model by vector
//   ModelRotate: rotate model
//   ModelMove: move model


function ShaderCompile(obj_gl, id, type) {
  if (! document.getElementById(id)) {return; }
  var shader = obj_gl.createShader(type);
  obj_gl.shaderSource(shader, document.getElementById(id).text);
  obj_gl.compileShader(shader);
  if (! obj_gl.getShaderParameter(shader, obj_gl.COMPILE_STATUS)) {
    console.log('ShaderCompile failed (' + id + '): ' + obj_gl.getShaderInfoLog(shader));
    return;
  }
  return shader;
}

function ProgramLink(obj_gl, vertex, fragment) {
  var program = obj_gl.createProgram();
  obj_gl.attachShader(program, vertex);
  obj_gl.attachShader(program, fragment);
  obj_gl.linkProgram(program);
  if (! obj_gl.getProgramParameter(program, obj_gl.LINK_STATUS)) {
    console.log('ProgramLink failed: ' + obj_gl.getProgramInfoLog(program));
    return;
  }
  obj_gl.useProgram(program);
  return program;
}

function CreateVBO(obj_gl, data) {
  var vbo = obj_gl.createBuffer();
  obj_gl.bindBuffer(obj_gl.ARRAY_BUFFER, vbo);
  obj_gl.bufferData(obj_gl.ARRAY_BUFFER, new Float32Array(data), obj_gl.STATIC_DRAW);
  obj_gl.bindBuffer(obj_gl.ARRAY_BUFFER, null);
  return vbo;
}

function BindVBO(obj_gl, vbo, attLoc, attStride) {
  for (var id in vbo) {
    obj_gl.bindBuffer(obj_gl.ARRAY_BUFFER, vbo[id]);
    obj_gl.enableVertexAttribArray(attLoc[id]);
    obj_gl.vertexAttribPointer(attLoc[id], attStride[id], obj_gl.FLOAT, false, 0, 0);
  }
}

// create sight direction matrix from cam and center position with up direction
// dest shall be identical 4x4 matrix (or not modified if error)
function CalcSightDir(cam, cent, up, dest) {
  if (cam[0] == cent[0] && cam[1] == cent[1] && cam[2] == cent[2]) {return; }
  var x = [0, 0, 0]; var y = [0, 0, 0]; var z = [0, 0, 0]; var idx =0;
  z[0] = cam[0] - cent[0]; z[1] = cam[1] - cent[1]; z[2] = cam[2] - cent[2];
  DivVec(z, CalcEV(z));
  CalcCP3(up, z, x);
  DivVec(x, CalcEV(x));
  CalcCP3(z, x, y);
  DivVec(y, CalcEV(y));
  dest[0] = x[0]; dest[1] = y[0], dest[2] = z[0], dest[3] = 0,
  dest[4] = x[1]; dest[5] = y[1], dest[6] = z[1], dest[7] = 0,
  dest[8] = x[2]; dest[9] = y[2], dest[10] = z[2], dest[11] = 0,
  dest[12] = -1.0 * CalcIP(x, cam); dest[13] = -1.0 * CalcIP(y, cam);
  dest[14] = -1.0 * CalcIP(z, cam); dest[15] = 1;
}

// create sight FoV matrix from degree, canvas size, near/far
// no need to initialize dest
function CalcSightFov(widthDegree, width, height, near, far, dest) {
  var a = near * Math.tan(widthDegree * Math.PI / 360);
  var b = a * width / height;
  var c = far - near;
  dest[0] = near / b; dest[1] = 0.0; dest[2] = 0.0; dest[3] = 0.0;
  dest[4] = 0; dest[5] = near / a; dest[6] = 0.0; dest[7] = 0.0;
  dest[8] = 0; dest[9] = 0.0; dest[10] = -(far + near) / (far - near);
  dest[11] = -1.0;
  dest[12] = 0.0; dest[13] = 0.0; dest[14] = - (far * near * 2) / (far - near);
  dest[15] = 0.0;
}

// scale model matrix by specified vector
function ModelScale(orig, scale, dest) {
  for (i = 0; i < 3; ++i) { for (j = 0; j < 4; ++j) {
    dest[j + 3 * i] = orig[j + 3 * i] * scale[i];
  } }
  for (i = 12; i < 15; ++i) { dest[i] = orig[i]; }
}

// rotate model by specified angle around axis
//   angle: angle to rotate in degree (not radian)
//   axis: rotation axis, origin (0,0,0)
function ModelRotate(orig, angle, axis, dest) {
  var a_rad = angle / 180 * Math.PI;
  DivVec(axis, CalcEV(axis));
  var rot_s = Math.sin(a_rad);
  var rot_c = Math.cos(a_rad);
  var mat_a = [
    axis[0] * axis[0], axis[0] * axis[1], axis[0] * axis[2],
    axis[1] * axis[0], axis[1] * axis[1], axis[1] * axis[2],
    axis[2] * axis[0], axis[2] * axis[1], axis[2] * axis[2]
  ];
  MulVec(mat_a, (1 - rot_c));
  mat_a[0] += rot_c;
  mat_a[1] += axis[2] * rot_s;
  mat_a[2] -= axis[1] * rot_s;
  mat_a[3] -= axis[2] * rot_s;
  mat_a[4] += rot_c;
  mat_a[5] += axis[0] * rot_s;
  mat_a[6] += axis[1] * rot_s;
  mat_a[7] -= axis[0] * rot_s;
  mat_a[8] += rot_c;
  for (i = 0; i < 4; ++i) { for (j = 0; j < 3; ++j) {
    dest[i + j * 4] = orig[i] * mat_a[j * 3] + orig[i + 4] * mat_a[j * 3 + 1]
      + orig[i + 8] * mat_a[j * 3 + 2];
  } }
  for (i = 12; i < 16; ++i) { dest[i] = orig[i]; }
}

// move model matrix by specified vector
function ModelMove(orig, move, dest) {
  for (i = 0; i < 12; ++i) { dest[i] = orig[i]; }
  for (i = 0; i < 4; ++i) {
    dest[i + 12] = orig[i] * move[0] + orig[i + 4] * move[1]
      + orig[i + 8] * move[2] + orig[i + 12]; 
  }
}

