// routines for vector/matrix
// functions without number can accept all dimentions

// CalcEV : Vector eigen value
// CalcIP : Vector inner product
// CalcCP3 : Vector(3) cross product
// DivVec : divide all vector items by value
// MulVec : multiply all vector items by value

// MatMul4 : Matrix(4,4) multiply

// eigenvalue
function CalcEV(vec) {
  var ev = 0.0;
  for (var id in vec) {ev += vec[id] * vec[id]; }
  return Math.sqrt(ev);
}

// inner product
function CalcIP(a, b) {
  var ret = 0.0;
  for (var id in a) {ret += a[id] * b[id]; }
  return ret;
}

// cross product
function CalcCP3(a, b, dest) {
  dest[0] = a[1] * b[2] - a[2] * b[1];
  dest[1] = a[2] * b[0] - a[0] * b[2];
  dest[2] = a[0] * b[1] - a[1] * b[0];
}

// div vector
function DivVec(vec, value) {
  if (value == 0) { for (var id in vec) {vec[id] = 0.0; } }
  else { for (var id in vec) {vec[id] /= value; } }
}

// multiply vector
function MulVec(vec, value) {
  for (var id in vec) {vec[id] *= value; };
}

// calc matrix mul
function MatMul4(a, b, dest) {
  var c_a = new Float32Array(16);
  var c_b = new Float32Array(16);
  for (i = 0; i < 16; ++i) { c_a[i] = a[i]; c_b[i] = b[i]; }
  for (i = 0; i < 4; ++i) { for (j = 0; j < 4; ++j){
    dest[i * 4 + j] = c_a[j] * c_b[i * 4] + c_a[j + 4] * c_b[i * 4 + 1] + 
      c_a[j + 8] * c_b[i * 4 + 2] + c_a[j + 12] * c_b[i * 4 + 3];
  } }
}



