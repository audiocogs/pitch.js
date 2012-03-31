FFT = this.FFT = ( function () {

var	pi2	= Math.PI * 2,
	sin	= Math.sin,
	cos	= Math.cos;

function FFT(inData, P, wnd) {
    this.p = P;
	var N = 1 << P;
	var M = N / 2;
	var m = M;
    
	var data = new Float32Array(N<<1);

    this.real = new Float32Array(N);
    this.imag = new Float32Array(N);

	for (var i=0, j=0; i<N; i++, m=M) {
		data[j*2] = inData[i] * wnd[i];
		while (m > 1 && m <= j) { j -= m; m >>= 1; }
		j += m;
	}

    for (var i=0; i < N; i++) {
        this.real[i] = data[2*i];
        this.imag[i] = data[2*i + 1];
    }

    this.compute();

    // reuse the buffer \o/
    for (var i=0; i < N; i++) {
        data[2*i] = this.real[i];
        data[2*i + 1] = this.imag[i];
    }

    return data;
       
}

FFT.calculateWindow = function (size) {
	var i, w = new Float32Array(size);

	for (i=0; i<size; i++) {
		w[i] = 0.53836 - 0.46164 * cos(pi2 * i / (size - 1));
	}

	return w;
};

FFT.prototype = {

  real: null,
  imag: null,

  /***************************************************************
  * fft.c
  * Douglas L. Jones 
  * University of Illinois at Urbana-Champaign 
  * January 19, 1992 
  * http://cnx.rice.edu/content/m12016/latest/
  * 
  *   fft: in-place radix-2 DIT DFT of a complex input 
  * 
  *   input: 
  * n: length of FFT: must be a power of two 
  * m: n = 2**m 
  *   input/output 
  * real: double array of length n with real part of data 
  * imag: double array of length n with imag part of data 
  * 
  *   Permission to copy and use this program is granted 
  *   as long as this header is included. 
  ****************************************************************/
  compute: function() {
    var real = this.real,
        imag = this.imag;
        p = this.p,
        n = 1 << p;

    var i,j,k,n1,n2,a;
    var c,s,e,t1,t2;
  
  
    // Bit-reverse
    j = 0;
    n2 = n/2;
    for (i=1; i < n - 1; i++) {
      n1 = n2;
      while ( j >= n1 ) {
        j = j - n1;
        n1 = n1/2;
      }
      j = j + n1;
    
      if (i < j) {
        t1 = real[i];
        real[i] = real[j];
        real[j] = t1;
        t1 = imag[i];
        imag[i] = imag[j];
        imag[j] = t1;
      }
    }

    // FFT
    n1 = 0;
    n2 = 1;
  
    for (i=0; i < p; i++) {
      n1 = n2;
      n2 = n2 + n2;
      a = 0;
    
      for (j=0; j < n1; j++) {
        c = cos(-2*Math.PI*a/n);
        s = sin(-2*Math.PI*a/n);
        a +=  1 << (p-i-1);

        for (k=j; k < n; k=k+n2) {
          t1 = c*real[k+n1] - s*imag[k+n1];
          t2 = s*real[k+n1] + c*imag[k+n1];
          real[k+n1] = real[k] - t1;
          imag[k+n1] = imag[k] - t2;
          real[k] = real[k] + t1;
          imag[k] = imag[k] + t2;
        }
      }
    }
  }

}

return FFT;

}());

if (typeof module !== 'undefined') {
	module.exports = FFT;
}
