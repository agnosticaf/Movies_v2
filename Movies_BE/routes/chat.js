var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var Member = require('../models/Member.js');
var Video = require('../models/Video.js');
var Rating = require('../models/Rating.js');
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

server.listen(4000);

// socket io
io.on('connection', function (socket) {
  console.log('User connected');
  const sessionID = socket.id;
  console.log(sessionID);
  socket.on('disconnect', function() {
    console.log('User disconnected');
  });
  socket.on('save-message', function (data) {
    console.log(data);
    io.emit('new-message', { message: data });
  });

  socket.on('register', function (data) {
  console.log(data)
      var member = Member.create(data, function (err, post) {
        if (err) {io.emit('register-no', err);}
          else {
          io.to(sessionID).emit('register-yes', post);
        }
    });
  });
  socket.on('profile', function (data) {
  console.log(data)
  Video.find({ uploaded_by: data })
  .populate({path: 'ratings', model: 'Rating'}).
  exec(function (err, videos) {
    if (err) {io.emit('profile-no', err);}
    //console.log('The videos are an array: ', videos);
    //io.emit('profile-yes', videos);
    io.to(sessionID).emit('profile-yes', videos);
    });
  });

  socket.on('main', function () {
  Video.find()
  .populate({path: 'ratings', model: 'Rating'}).
   populate({path: 'uploaded_by', model: 'Member'}).
  exec(function (err, videos) {
    if (err) {io.emit('main-no', err);}
    console.log('The videos are an array: ', videos);
    io.emit('main-yes', videos);
    });
  });

  socket.on('edit', function (data) {
    console.log(data)
    Video.findById(data._id, function (err, video) {
      if (err) return handleError(err);
      video.title = data.title;
      video.save(function (err, updatedVideo) {
        if (err) {io.emit('edit-no', err);}
        else{io.emit('edit-yes', updatedVideo);}
      });
    });
  });

  socket.on('delete', function (data) {
    console.log(data)
    Video.deleteOne({ _id: data._id }, function (err) {
    if (err) {io.emit('delete-no', err);}
        else{
        fs.unlink('src/assets/uploads/'+data.path, (err) => {
          if (err) {io.emit('delete-no', err);}
          else{io.emit('delete-yes', data.title);}
          });
        }
      });
  });

  socket.on('rate', function (data) {
    console.log(data)
      var rating = new Rating({
          rating: data.rating,
          rated_by: data.rated_by,
          video_rated: data.video_rated
      });

      rating.save(function (err, savedRating) {
        if (err) {io.emit('rate-no', err);}
        else{
        Video.findById(data.video_rated, function (err, video) {
          if (err) {io.emit('rate-no', err);}
          video.ratings.push(savedRating);
          video.save(function (err, updatedVideo) {
            if (err) {io.emit('rate-no', err);}
            else{
               Video.findOne({ _id: data.video_rated }).populate({path: 'ratings', model: 'Rating'}).
              exec(function (err, ratedVideo ) {
              if (err) {io.emit('profile-no', err);}
              console.log('The video', ratedVideo);
              io.emit('rate-yes', ratedVideo);
              });}
            });
          });
          }
        });
  });

});

router.post('/', function (req, res, next) {
  console.log(req.body)
      var member = Member.create(req.body, function (err, post) {
        if (err) {res.status(401).json(err);}
          else {
            console.log(member)
            res.json(member);
        }
    });
});


router.post('/login', function (req, res, next) {
  console.log(req.body);
  Member.findOne({ username: req.body.username}, function (err, member) {
    if (err) {res.status(402).json(err);}
      else {
        console.log(member._id)
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
     upload(req, res, function (err) {
       console.log(req.body)
      if (err) {
        console.log(err);
       // An error occurred when uploading
        res.status(422).send("an Error occured");
      }else {
          // No error occured.
          //path = req.file.path;
          var video = new Video({
              title: req.body.title,
              uploaded_by: req.body.uploaded_by,
              path: req.file.filename
          });

      video.save(function (err) {
        if (err) {res.status(401).json(err);}
        else{
          io.emit('uploaded', { message: 'uppload success' });
          console.log(req.file.filename)
          res.json(req.file.filename);
        }
        });}
      });
});

module.exports = router;
