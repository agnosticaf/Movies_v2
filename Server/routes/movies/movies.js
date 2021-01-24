var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
// var app = express();
// var server = require('http').createServer(app);
// var io = require('socket.io')(server);
var Member = require('../../models/Member.js');
var Video = require('../../models/Video.js');
var Rating = require('../../models/Rating.js');
var bcrypt = require('bcrypt');
var multer = require('multer');
var fs = require('fs')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

var upload = multer({ storage: storage }).single('file');

// server.listen(4000);

router.post('/', function (req, res, next) {
  console.log(req.body)
  var member = Member.create(req.body, function (err, post) {
    if (err) { res.status(401).json(err); }
    else {
      console.log(member)
      res.json(member);
    }
  });
});


router.post('/login', function (req, res, next) {
  console.log('this is the request body:');
  console.log(req.body);
  Member.findOne({ username: req.body.username }, function (err, member) {
    console.log(err, member)
    if (err) { res.status(402).json(err); }
    else {
      console.log(member)
      bcrypt.compare(req.body.password, member.password, function (error, result) {
        if (result === true) {
          res.json(member);
        } else {
          console.log(error)
          res.status(401).json(error);
        }
      });
    }
  });
});

router.post('/upload', function (req, res, next) {
  var dir = 'public/uploads';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  upload(req, res, function (err) {
    console.log(req.body)
    if (err) {
      console.log(err);
      // An error occurred when uploading
      res.status(422).send("an Error occured");
    } else {
      // No error occured.
      //path = req.file.path;
      var video = new Video({
        title: req.body.title,
        uploaded_by: req.body.uploaded_by,
        path: req.file.filename
      });

      video.save(function (err) {
        if (err) { res.status(401).json(err); }
        else {
          //io.emit('uploaded', { message: 'uppload success' });
          console.log(req.file.filename)
          res.json(req.file.filename);
        }
      });
    }
  });
});

module.exports = router;
