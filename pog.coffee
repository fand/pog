# pog.coffee
# 2013/08/25 - 

class Pog
    constructor: (ctx, stream_length) ->
        @node = ctx.createScriptProcessor(stream_length, 1, 1)
        @stream_length = stream_length
        @gain = {x1:1, x2:1, x3:1, x4:1, x5:1, x_1:1, x_2: 1}
        @gain_sum = 7.0
        @x1_last = 1.0
        @x_1_last = 1.0
        @x_2_last = 1.0
        @on = true

    toggle: () ->
        @on = not @on
        if @on then "bypass" else "on"

    connect: (dst) -> @node.connect(dst);

    setGain: (id, gain) ->
        @gain[id] = gain
        @gain_sum = 0.0
        @gain_sum += value for key, value of @gain
         
    play: (e) ->
        input = e.inputBuffer.getChannelData(0)
        output = e.outputBuffer.getChannelData(0)            
        if not @on
            for i in [0...@stream_length]
                output[i] = input[i]
            return
        for i in [0...@stream_length]

            x1 = input[i]
            x2 = Math.abs(x1) * 2.0 - 1.0
            x3 = Math.abs(x2) * 2.0 - 1.0
            x4 = Math.abs(x3) * 2.0 - 1.0
            x5 = Math.abs(x4) * 2.0 - 1.0

            x_1 = if x1 > 0.0 and @x1_last  < 0.0 then -@x_1_last else @x_1_last
            x_2 = if x_1 > 0.0 and @x_1_last < 0.0 then -@x_2_last else @x_2_last
            @x1_last = x1
            @x_1_last = x_1
            @x_2_last = x_2            

            output[i] = (x1 * @gain.x1 +
                         x2 * @gain.x2 +
                         x3 * @gain.x3 +
                         x4 * @gain.x4 +
                         x5 * @gain.x5 +
                         x_1 * @gain.x_1 +
                         x_2 * @gain.x_2) / @gain_sum
                

class BufferLoader
    constructor: (ctx, url, callback) ->
        @ctx = ctx
        @url = url
        @onload = callback

    load: () ->
        req = new XMLHttpRequest()
        req.open("GET", @url, true)
        req.responseType = "arraybuffer"
        req.onload = () =>
            @ctx.decodeAudioData(
                req.response, 
                ((buffer) => @onload(buffer))
            )
        req.onerror = () -> console.log "Error: BufferLoader XHR error"
        req.send()


$(()->

    ctx = new webkitAudioContext()
    pog = new Pog(ctx, 1024)

    pog.node.onaudioprocess = ((e) -> pog.play(e))

    loader = new BufferLoader(ctx, "test.mp3", (
        (buffer) ->
            mp3 = ctx.createBufferSource()
            mp3.buffer = buffer
            mp3.loop = true;
            mp3.connect(pog.node)
            mp3.noteOn(0)
    ))
    loader.load()
    pog.connect(ctx.destination)

    $(".vol").change(
        () ->
            pog.setGain $(this).attr("id"), ($(this).val() / 100)
    )

    $("#toggle").click(
        () ->
            $(this).val(pog.toggle())
    )

    $(".vol").change()
)
