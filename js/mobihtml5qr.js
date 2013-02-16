(function() {

  function detectSubsampling(img) {
      var imageWidth = img.naturalWidth, imageHeight = img.naturalHeight;
      if (imageWidth * imageHeight > 1024 * 1024) { // subsampling may happen over megapixel image
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, -imageWidth + 1, 0);
        // subsampled image becomes half smaller in rendering size.
        // check alpha channel value to confirm image is covering edge pixel or not.
        // if alpha value is 0 image is not covering, hence subsampled.
        var res = ctx.getImageData(0, 0, 1, 1).data[3] === 0;
        canvas = null;
        return res;
      } else {
        return false;
      }
  }

  function detectVerticalSquash(img, imageWidth, imageHeight) {
      var canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = imageHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var data = ctx.getImageData(0, 0, 1, imageHeight).data;
      // search image edge pixel position in case it is squashed vertically.
      var sy = 0;
      var ey = imageHeight;
      var py = imageHeight;
      while (py > sy) {
        var alpha = data[(py - 1) * 4 + 3];
        if (alpha === 0) {
          ey = py;
        } else {
          sy = py;
        }
        py = (ey + sy) >> 1;
      }
      canvas = null;
      return py / imageHeight;
  }

  function drawQRToCanvas(image){
    var canvas = document.getElementById("qr-canvas");
    var MAX_WIDTH = 400, MAX_HEIGHT = 400;
    var naturalWidth = image.naturalWidth, naturalHeight = image.naturalHeight;
    var width = image.width, height = image.height;

    var ctx = canvas.getContext('2d');
    ctx.save();

    // Reduce image size to maximum dimension requirements, keeps aspect ratio
    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    // Detect if image was subsampled
    var subsampled = detectSubsampling(image);
    if (subsampled) {
      naturalWidth /= 2;
      naturalHeight /= 2;
    }

    var d = 800; // size of tiling canvas
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = tmpCanvas.height = d;
    var tmpCtx = tmpCanvas.getContext('2d');
    var vertSquashRatio = detectVerticalSquash(image, naturalWidth, naturalHeight);
    var sy = 0;
    while (sy < naturalHeight) {
      var sh = sy + d > naturalHeight ? naturalHeight - sy : d;
      var sx = 0;
      while (sx < naturalWidth) {
        var sw = sx + d > naturalWidth ? naturalWidth - sx : d;
        tmpCtx.clearRect(0, 0, d, d);
        tmpCtx.drawImage(image, -sx, -sy);
        var dx = Math.floor(sx * width / naturalWidth);
        var dw = Math.ceil(sw * width / naturalWidth);
        var dy = Math.floor(sy * height / naturalHeight / vertSquashRatio);
        var dh = Math.ceil(sh * height / naturalHeight / vertSquashRatio);
        ctx.drawImage(tmpCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
        sx += d;
      }
      sy += d;
    }
    ctx.restore();
    tmpCanvas = tmpCtx = null;

  };

  function read(a)
  {
    window.location.href=a;
  }

  /**
   * mobiHTML5QRScan class
   */
  function mobiHTML5QRScan(fileInputID){

    var fileInput = document.getElementById(fileInputID);
    fileInput.onchange = function() {
      // Get the single file from the File upload
      var file = fileInput.files[0];

      // Only process image files
      if (!file.type.match('image.*')) {
        return;
      }

      var reader = new FileReader();

      // Event handler managing once the FileReader object has been fully assigned the base64 image
      reader.onloadend = function(e){

          var image = new Image();
          image.onload = function(e){

            drawQRToCanvas(image);

            try{
              qrcode.callback = read;
              qrcode.decode();
            } catch(err) {
              //log detailed error here
              alert("QR code not recognized, please make sure QR code is clear and aligned then try again. Details: " + err);
            }
          }

          // Create an image object and assign the source of the object to the base64 rep of the photo
          image.src = e.target.result;
      }

      // Assign the base64 representation of the image
      reader.readAsDataURL(file);
    };
  };

  /**
   * Export class to global
   */
  if (typeof define === 'function' && define.amd) {
    define([], function() { return MegaPixImage; }); // for AMD loader
  } else {
    this.mobiHTML5QRScan = mobiHTML5QRScan;
  }

})();