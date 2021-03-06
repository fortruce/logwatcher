var exec = require('child_process').exec;
var fs = require('fs');
var os = require('os');
var path = require('path');
var nf = require('fsnotifier');

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

function record(filename, ffmpegOpts) {
  var cmd = ffmpeg(filename, ffmpegOpts);
  console.log('running:', cmd);
  return exec(
    cmd,
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

function Recorder(ffmpegOpts) {
  this._handle = undefined;
  this._ffmpegOpts = ffmpegOpts;
}

Recorder.prototype.start = function(filename) {
  this.stop();
  this._handle = record(filename, this._ffmpegOpts);
}

Recorder.prototype.stop = function() {
  if (this._handle) {
    this._handle.on('exit', function () {
      console.log('video captured');
    });
    this._handle.stdin.write('q');
    this._handle.stdin.end();
  }
}

var logPath;
var ffmpegOpts;
if (os.platform() === 'darwin') {
  logPath = path.join(process.env['HOME'], 'Library/Logs/Unity/Player.log');
  ffmpegOpts = {
    '-f': 'avfoundation',
    '-vsync': '2',
    '-i': '"1:none"',
    '-r': '30'
  }
} else {
  logPath = 'C:\\Program Files (x86)\\Hearthstone\\Hearthstone_Data\\output_log.txt';
  ffmpegOpts = {
    '-f': 'dshow',
    '-i': 'video="screen-capture-recorder"',
    '-s': '1280x800',
    '-r': '30'
  }
}

var index = 0;
var recorder = new Recorder(ffmpegOpts);

var notifier = nf(logPath);

function fileName(index, video) {
  while (index.toString().length < 4) {
    index = '0' + index.toString();
  }
  if (video) {
    return 'output/video_' + index + '.mp4';
  }
  return 'output/text_' + index + '.txt';
}

recorder.start(fileName(index, true));

notifier.on('change', function(stream) {
  stream.pipe(fs.createWriteStream(fileName(index, false)));
  index++;
  recorder.start(fileName(index, true));
});