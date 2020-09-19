var canvas;
var gl;
var obj_program;
var attLoc;
var attStride;

var fetch_data = [];
var fetch_data_run = 0;
var fetch_data_interval = 500;

const def_zoom = 1.5;

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

  // register events
  document.getElementById('reset').addEventListener('click', () => {
      document.getElementById('rot_x_value').value = 0;
      document.getElementById('rot_y_value').value = 0;
      document.getElementById('rot_z_value').value = 0;
      document.getElementById('zoom_value').value = 1.0;
    });
  reg_click_func([
    { 'id': 'draw', 'func': DrawPoints },
    { 'id': 'data_load', 'func': LoadCSV },
    { 'id': 'data_prev', 'func': () => { ShowData(-1); } },
    { 'id': 'data_next', 'func': () => { ShowData(1); } },
    { 'id': 'data_run', 'func': StartAnim },
    { 'id': 'data_stop', 'func': StopAnim },
    { 'id': 'rot_x_cw', 'func': () => { mod_rot('x', -5); DrawPoints(); } },
    { 'id': 'rot_x_ccw', 'func': () => { mod_rot('x', 5); DrawPoints(); } },
    { 'id': 'rot_y_cw', 'func': () => { mod_rot('y', -5); DrawPoints(); } },
    { 'id': 'rot_y_ccw', 'func': () => { mod_rot('y', 5); DrawPoints(); } },
    { 'id': 'rot_z_cw', 'func': () => { mod_rot('z', -5); DrawPoints(); } },
    { 'id': 'rot_z_ccw', 'func': () => { mod_rot('z', 5); DrawPoints(); } },
    { 'id': 'zoom_in', 'func': () => { mod_zoom(def_zoom); DrawPoints(); } },
    { 'id': 'zoom_out', 'func': () => { mod_zoom(1.0 / def_zoom); DrawPoints(); } },
  ]);
}
window.addEventListener('load', glprep);

// targets = [ { 'id': 'target element ID', 'func': ref of function }, ... ]
function reg_click_func(targets) {
  targets.forEach((tgt) => {
    document.getElementById(tgt['id']).addEventListener('click', tgt['func']);
  });
}

function mod_rot(axis, angle) {
  var c_id = 'rot_' + axis + '_value';
  var c_angle = parseInt(document.getElementById(c_id).value);
  document.getElementById(c_id).value = c_angle + angle;
}
function mod_zoom(mul) {
  var c_zoom = Number(document.getElementById('zoom_value').value);
  document.getElementById('zoom_value').value = Math.floor(c_zoom * mul * 100) / 100;
}

// test function
function DrawPoints() {
  // position array, (x, y, z) * n : [x1, y1, z1, x2, y2, z2, ...]
  var fetch_data_cline = parseInt(document.getElementById('data_cur').value);
  if ((fetch_data_cline < 0) || (fetch_data_cline >= fetch_data.length)) {
    console.log("Error, target line number is out of scope");
    return;
  }
  var Points = fetch_data[fetch_data_cline];
  OutRawData(Points);
  // color array, (r, g, b, a) * n : [r1, g1, b1, a1, r2, g2, b2, a2, ...]
  var Colors = [];
  for (var i = 0; i < 5; ++i) { Colors.push([1.0, 0.0, 0.0, 1.0]); }
  for (var i = 0; i < 5; ++i) { Colors.push([0.0, 1.0, 0.0, 1.0]); }
  Colors = Colors.flat();
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
  var rot_angle = [
    parseInt(document.getElementById('rot_x_value').value),
    parseInt(document.getElementById('rot_y_value').value),
    parseInt(document.getElementById('rot_z_value').value)
  ];
  var c_zoom = Number(document.getElementById('zoom_value').value);
  var sight = [
    Number(document.getElementById("sight_x").value),
    Number(document.getElementById("sight_y").value),
    Number(document.getElementById("sight_z").value),
  ];
  CalcSightDir(sight, [0, 0, 0], [0, 0, 1], matV);
  CalcSightFov(90, canvas.width, canvas.height, 0.1, 100, matP);
//  ModelMove(matM, [1.0, 0.0, 2.0], matM);
  ModelScale(matM, [c_zoom, c_zoom, c_zoom], matM);
  ModelRotateXYZ(matM, rot_angle, matM);
  MatMul4(matP, matV, matMvp);
  MatMul4(matMvp, matM, matMvp);

  // draw points by binding VBO
  BindVBO(gl, [vbo_pos, vbo_color], attLoc, attStride);
  gl.uniformMatrix4fv(uniLocation[0], false, matMvp);
  gl.uniform1f(uniLocation[1], pointSize);
  gl.drawArrays(gl.POINTS, 0, Points.length / 3);

//  BindVBO(gl, [vbo_pos, vbo_color], attLoc, attStride);
//  gl.uniformMatrix4fv(uniLocation[0], false, matMvp);
//  gl.drawArrays(gl.LINE_STRIP, 0, Points.length / 3);

  DrawAxis(matMvp);
  // show
  gl.flush();
  console.log('flushed');
}

function DrawAxis(matMvp) {
  DrawLines([-10.0, 0.0, 0.0, 10.0, 0.0, 0.0], [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0], matMvp);
  DrawLines([0.0, -10.0, 0.0, 0.0, 10.0, 0.0], [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0], matMvp);
  DrawLines([0.0, 0.0, -10.0, 0.0, 0.0, 10.0], [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0], matMvp);
}
function DrawLines(l_pos, l_col, matMvp) {
  var uniLocMvp = gl.getUniformLocation(obj_program, 'mvpMatrix');
  BindVBO(gl, [CreateVBO(gl, l_pos), CreateVBO(gl, l_col)], attLoc, attStride);
  gl.uniformMatrix4fv(uniLocMvp, false, matMvp);
//  gl.uniformMatrix4fv(gl.getUniformLocation(obj_program, 'mvpMatrix'), false, matMvp);
  gl.drawArrays(gl.LINE_STRIP, 0, l_pos.length / 3);
}


function LoadCSV() {
  var target = document.getElementById('data_url').value;
  document.getElementById('data_total').innerText = 'loading...';
  fetch(target, { mode: 'cors' })
  .then(function(response) {
    if (response.ok) {return response.text(); }
    throw Error('Returned response for data: ' + response.status);
  }).then(function(data) {
    fetch_data = [];
    var data_lines = data.split('\n');
    data_lines.shift(); // remove first label line
    data_lines.forEach((line) => {
      var data_dat = [];
      var flag = 0;
      data_dat = line.split(',');
      for (var id in data_dat) {
        data_dat[id] = Number(data_dat[id].trim());
        if (isNaN(data_dat[id])) {++flag; }
      }
      if ((flag == 0) && (data_dat.length == 30)) {
        fetch_data.push(data_dat);
      }
    });
    document.getElementById('data_total').innerText = fetch_data.length;
  }).catch(function(error) {
    console.log('Error found on loading data: ' + error.message);
    window.alert('Error found on loading data: ' + error.message);
    document.getElementById('data_total').innerText = 'ERROR';
  });
}

function ShowData(hop) {
  var next = parseInt(document.getElementById('data_cur').value);
  next += hop;
  if (next < 0) {next = 0; }
  if (next >= fetch_data.length) {next = fetch_data.length - 1; }
  document.getElementById('data_cur').value = (next + 1);
  DrawPoints();
}

function StartAnim() {
  if (fetch_data_run != 0) {return; }
  document.getElementById('data_run').disabled = true;
  document.getElementById('data_stop').disabled = false;
  fetch_data_run = setInterval(() => ShowData(1), fetch_data_interval);
}

function StopAnim() {
  if (fetch_data_run == 0) {return; }
  clearInterval(fetch_data_run);
  document.getElementById('data_run').disabled = false;
  document.getElementById('data_stop').disabled = true;
  fetch_data_run = 0;
}

function OutRawData(data) {
  var show = "";
  // helpers
  var stat = (varr) => {
    var mid = [ 0.0, 0.0, 0.0 ];
    for (var i = 0; i < 5; ++i) { for (var ax = 0; ax < 3; ++ax) {
      mid[ax] += varr[i * 3 + ax];
    } };
    for (var ax = 0; ax < 3; ++ax) { mid[ax] /= 5.0; }
    return mid;
  };
  var num_text = (val) => {
    var ret = "";
    if (val >= 0.0) { ret += "+" + val; } else { ret += val; }
    ret = ret.substring(0, 7); // +X.XXXX
    return ret;
  };
  var calc_dist = (v1, v2) => {
    var sum = 0.0;
    for (var i = 0; i < 3; ++i) { sum += (v1[i] - v2[i]) ** 2; }
    return Math.sqrt(sum);
  };
  // calc stat
  var g_left = stat(data.slice(0, 15));
  var g_right = stat(data.slice(15));
  var stat_lines = [ '', '', '', '', '' ];
  var dist_left = [
    calc_dist(data.slice( 0,  3), g_left),
    calc_dist(data.slice( 3,  6), g_left), 
    calc_dist(data.slice( 6,  9), g_left), 
    calc_dist(data.slice( 9, 12), g_left), 
    calc_dist(data.slice(12, 15), g_left)
  ];
  var dist_right = [
    calc_dist(data.slice(15, 18), g_left),
    calc_dist(data.slice(18, 21), g_left), 
    calc_dist(data.slice(21, 24), g_left), 
    calc_dist(data.slice(24, 27), g_left), 
    calc_dist(data.slice(27, 30), g_left)
  ];
  var stat_left = [ 0.0, 0.0 ];
  var stat_right = [ 0.0, 0.0 ];
  for (var i = 0; i < 5; ++i) {
    stat_left[0] += dist_left[i]; stat_left[1] += dist_left[i] ** 2;
    stat_right[0] += dist_right[i]; stat_right[1] += dist_right[i] ** 2;
  }
  stat_left[1] = Math.sqrt(stat_left[1]);
  stat_right[1] = Math.sqrt(stat_right[1]);
  stat_lines[0] += "SUM    (" + num_text(stat_left[0]) + ", " + num_text(stat_right[0]) + ")";
  stat_lines[1] += "M-SQ   (" + num_text(stat_left[1]) + ", " + num_text(stat_right[1]) + ")";
  // start output
  show += "RAW\n";
  show += "  LEFT                         RIGHT                            STAT (LEFT, RIGHT)\n";
  for (var i = 0; i < 5; ++i) {
    show += "  (" + num_text(data[i * 3]) + ", " + num_text(data[i * 3 + 1]) +
      ", " + num_text(data[i * 3 + 2]) + ") ";
    show += "(" + num_text(data[i * 3 + 15]) + ", " + num_text(data[i * 3 + 16]) +
      ", " + num_text(data[i * 3 + 17]) + ") ";
    show += "        ";
    show += stat_lines[i];
    show += "\n";
  }
  show += "G ";
  show += "(" + num_text(g_left[0]) + ", " + num_text(g_left[1]) + ", " + num_text(g_left[2]) + ") ";
  show += "(" + num_text(g_right[0]) + ", " + num_text(g_right[1]) + ", " + num_text(g_right[2]) + ") ";
  document.getElementById('data_calc').innerText = show;
}

