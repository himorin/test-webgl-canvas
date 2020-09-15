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
  else { for (var id in vec) {vec[id] / value; } }
}

// multiply vector
function MulVec(vec, value) {
  for (var id in vec) {vec[id] *= value; };
}

// calc matrix mul
function MatMul4(a, b, dest) {
  dest[ 0] = a[ 0] * b[ 0] + a[ 4] * b[ 1] + a[ 8] * b[ 2] + a[12] * b[ 3];
  dest[ 1] = a[ 1] * b[ 0] + a[ 5] * b[ 1] + a[ 9] * b[ 2] + a[13] * b[ 3];
  dest[ 2] = a[ 2] * b[ 0] + a[ 6] * b[ 1] + a[10] * b[ 2] + a[14] * b[ 3];
  dest[ 3] = a[ 3] * b[ 0] + a[ 7] * b[ 1] + a[11] * b[ 2] + a[15] * b[ 3];
  dest[ 4] = a[ 0] * b[ 4] + a[ 4] * b[ 5] + a[ 8] * b[ 6] + a[12] * b[ 7];
  dest[ 5] = a[ 1] * b[ 4] + a[ 5] * b[ 5] + a[ 9] * b[ 6] + a[13] * b[ 7];
  dest[ 6] = a[ 2] * b[ 4] + a[ 6] * b[ 5] + a[10] * b[ 6] + a[14] * b[ 7];
  dest[ 7] = a[ 3] * b[ 4] + a[ 7] * b[ 5] + a[11] * b[ 6] + a[15] * b[ 7];
  dest[ 8] = a[ 0] * b[ 8] + a[ 4] * b[ 9] + a[ 8] * b[10] + a[12] * b[11];
  dest[ 9] = a[ 1] * b[ 8] + a[ 5] * b[ 9] + a[ 9] * b[10] + a[13] * b[11];
  dest[10] = a[ 2] * b[ 8] + a[ 6] * b[ 9] + a[10] * b[10] + a[14] * b[11];
  dest[11] = a[ 3] * b[ 8] + a[ 7] * b[ 9] + a[11] * b[10] + a[15] * b[11];
  dest[12] = a[ 0] * b[12] + a[ 4] * b[13] + a[ 8] * b[14] + a[12] * b[15];
  dest[13] = a[ 1] * b[12] + a[ 5] * b[13] + a[ 9] * b[14] + a[13] * b[15];
  dest[14] = a[ 2] * b[12] + a[ 6] * b[13] + a[10] * b[14] + a[14] * b[15];
  dest[15] = a[ 3] * b[12] + a[ 7] * b[13] + a[11] * b[14] + a[15] * b[15];
}



