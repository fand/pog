// Generated by CoffeeScript 1.6.3
(function() {
  var BufferLoader, Pog;

  Pog = (function() {
    function Pog(ctx, stream_length) {
      this.node = ctx.createScriptProcessor(stream_length, 1, 1);
      this.stream_length = stream_length;
      this.gain = {
        x1: 1,
        x2: 1,
        x3: 1,
        x4: 1,
        x5: 1,
        x_1: 1,
        x_2: 1
      };
      this.gain_sum = 7.0;
      this.x1_last = 1.0;
      this.x_1_last = 1.0;
      this.x_2_last = 1.0;
      this.on = true;
    }

    Pog.prototype.toggle = function() {
      this.on = !this.on;
      if (this.on) {
        return "bypass";
      } else {
        return "on";
      }
    };

    Pog.prototype.connect = function(dst) {
      return this.node.connect(dst);
    };

    Pog.prototype.setGain = function(id, gain) {
      var key, value, _ref, _results;
      this.gain[id] = gain;
      this.gain_sum = 0.0;
      _ref = this.gain;
      _results = [];
      for (key in _ref) {
        value = _ref[key];
        _results.push(this.gain_sum += value);
      }
      return _results;
    };

    Pog.prototype.play = function(e) {
      var i, input, output, x1, x2, x3, x4, x5, x_1, x_2, _i, _j, _ref, _ref1, _results;
      input = e.inputBuffer.getChannelData(0);
      output = e.outputBuffer.getChannelData(0);
      if (!this.on) {
        for (i = _i = 0, _ref = this.stream_length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          output[i] = input[i];
        }
        return;
      }
      _results = [];
      for (i = _j = 0, _ref1 = this.stream_length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
        x1 = input[i];
        x2 = Math.abs(x1) * 2.0 - 1.0;
        x3 = Math.abs(x2) * 2.0 - 1.0;
        x4 = Math.abs(x3) * 2.0 - 1.0;
        x5 = Math.abs(x4) * 2.0 - 1.0;
        x_1 = x1 > 0.0 && this.x1_last < 0.0 ? -this.x_1_last : this.x_1_last;
        x_2 = x_1 > 0.0 && this.x_1_last < 0.0 ? -this.x_2_last : this.x_2_last;
        this.x1_last = x1;
        this.x_1_last = x_1;
        this.x_2_last = x_2;
        _results.push(output[i] = (x1 * this.gain.x1 + x2 * this.gain.x2 + x3 * this.gain.x3 + x4 * this.gain.x4 + x5 * this.gain.x5 + x_1 * this.gain.x_1 + x_2 * this.gain.x_2) / this.gain_sum);
      }
      return _results;
    };

    return Pog;

  })();

  BufferLoader = (function() {
    function BufferLoader(ctx, url, callback) {
      this.ctx = ctx;
      this.url = url;
      this.onload = callback;
    }

    BufferLoader.prototype.load = function() {
      var req,
        _this = this;
      req = new XMLHttpRequest();
      req.open("GET", this.url, true);
      req.responseType = "arraybuffer";
      req.onload = function() {
        return _this.ctx.decodeAudioData(req.response, (function(buffer) {
          return _this.onload(buffer);
        }));
      };
      req.onerror = function() {
        return console.log("Error: BufferLoader XHR error");
      };
      return req.send();
    };

    return BufferLoader;

  })();

  $(function() {
    var ctx, loader, pog;
    ctx = new webkitAudioContext();
    pog = new Pog(ctx, 1024);
    pog.node.onaudioprocess = (function(e) {
      return pog.play(e);
    });
    loader = new BufferLoader(ctx, "test.mp3", (function(buffer) {
      var mp3;
      mp3 = ctx.createBufferSource();
      mp3.buffer = buffer;
      mp3.loop = true;
      mp3.connect(pog.node);
      return mp3.noteOn(0);
    }));
    loader.load();
    pog.connect(ctx.destination);
    $(".vol").change(function() {
      return pog.setGain($(this).attr("id"), $(this).val() / 100);
    });
    $("#toggle").click(function() {
      return $(this).val(pog.toggle());
    });
    return $(".vol").change();
  });

}).call(this);
