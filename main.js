var nf = require('./notify');
var exec = require('child_process').exec;
var fs = require('fs');

function ffmpeg(filename, options) {
  var cmd = ['ffmpeg'];
  for (var option in options) {
    cmd.push(option);
    if (options[option]) {
      cmd.push(options[option]);
    }
  }
  cmd.push(filename);
  return cmd.join(' ');
}

function record(filename, screen) {
  return exec(
    ffmpeg(filename, {
              '-threads': '2',
              '-rtbufsize': '1000M',
              '-r': '24',
              '-f': 'dshow',
              '-i': 'video="screen-capture-recorder"',
    }),
    {
      'cwd': process.cwd()
    },
    function (error, stdout, stderr) {
      if (error) {
        console.error(error);
        return;
      }
    });
}

function Recorder(screen) {
  this.screen = screen;
}

Recorder.prototype.start = function(filename) {
  this._handle = record(filename, this.screen);
}

Recorder.prototype.restart = function(filename) {
  this.stop();
  this.start(filename);
}

Recorder.prototype.stop = function() {
  this._handle.kill();
  this._handle.on('exit', function () {
    console.log('video captured');
  });
}

var index = 0;
var recorder = new Recorder('Hearthstone');
var notifier = nf.notify('C:\\Program Files (x86)\\Hearthstone\\Hearthstone_Data\\output_log.txt');

recorder.start('output/video_' + index + '.mp4');

notifier.on('change', function(stream) {
  stream.pipe(fs.createWriteStream('output/text_' + index + '.txt'));
  index++;
  recorder.restart('output/video_' + index + '.mp4');
});