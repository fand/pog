/**
 * pog.coffee
 * 2013/08/25 -
 */
// navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

class Pog {
    constructor(ctx, stream_length) {
        this.node = ctx.createScriptProcessor(stream_length, 1, 1);
        this.stream_length = stream_length;
        this.gain = { x1: 1, x2: 1, x3: 1, x4: 1, x5: 1, x_1: 1, x_2: 1 };
        this.gain_sum = 7.0;
        this.x1_last = 1.0;
        this.x_1_last = 1.0;
        this.x_2_last = 1.0;
        this.on = true;

        this.node.onaudioprocess = (e) => this.play(e);
        this.node.connect(ctx.destination);
    }

    toggle() {
        this.on = !this.on;
        return this.on ? 'bypass' : 'on';
    }

    connect(dst) {
        this.node.connect(dst);
    }

    setGain(id, gain) {
        this.gain[id] = gain;
        this.gain_sum = Object.values(this.gain).reduce((x, y) => x + y, 0);
    }

    play(e) {
        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);

        if (!this.on) {
            for (let i = 0; i < this.stream_length; i++) {
                output[i] = input[i];
            }
            return;
        }

        for (let i = 0; i < this.stream_length; i++) {
            const x1 = input[i];
            const x2 = Math.abs(x1) * 2.0 - 1.0;
            const x3 = Math.abs(x2) * 2.0 - 1.0;
            const x4 = Math.abs(x3) * 2.0 - 1.0;
            const x5 = Math.abs(x4) * 2.0 - 1.0;

            const x_1 = (x1 > 0.0 && this.x1_last < 0.0 ) ? -this.x_1_last : this.x_1_last;
            const x_2 = (x_1 > 0.0 && this.x_1_last < 0.0) ? -this.x_2_last : this.x_2_last;

            this.x1_last = x1;
            this.x_1_last = x_1;
            this.x_2_last = x_2;

            output[i] = (
                x1 * this.gain.x1 +
                x2 * this.gain.x2 +
                x3 * this.gain.x3 +
                x4 * this.gain.x4 +
                x5 * this.gain.x5 +
                x_1 * this.gain.x_1 +
                x_2 * this.gain.x_2
            ) / this.gain_sum;
        }
    }
}


class BufferLoader {
    constructor(ctx, url, callback) {
        this.ctx = ctx;
        this.url = url;
        this.onload = callback;
    }

    load() {
        const req = new XMLHttpRequest();
        req.open('GET', this.url, true);
        req.responseType = 'arraybuffer';
        req.onload = () => {
            this.ctx.decodeAudioData(req.response, this.onload);
        }
        req.onerror = () => console.log('Error: BufferLoader XHR error');
        req.send();
    }
}

$(() => {
    const ctx = new AudioContext();
    const pog = new Pog(ctx, 1024);

    const loader = new BufferLoader(ctx, 'test.mp3', (buffer) => {
      const mp3 = ctx.createBufferSource();
      mp3.buffer = buffer;
      mp3.loop = true;
      mp3.connect(pog.node);
      console.log(mp3);
      mp3.start(0);
    })
    loader.load();

    // navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    //     const microphone = ctx.createMediaStreamSource(stream);
    //     microphone.connect(pog.node);
    // });

    $('.vol').on('change', (e) => {
        const $self = $(e.currentTarget);
        pog.setGain($self.attr('id'), ($self.val() / 100));
    });

    $('#toggle').on('click', (e) => {
        $(e.currentTarget).val(pog.toggle());
    });

    $('.vol').change();
});
