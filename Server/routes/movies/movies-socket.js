var Member = require('../../models/Member.js');
var Video = require('../../models/Video.js');
var Rating = require('../../models/Rating.js');
var fs = require('fs');

function register(data) {
    console.log(data)
    var io = this.socket
    Member.create(data, function (err, post) {
        if (err) {
            console.log(err)
            io.emit('register-no', err);
        }
        else {
            console.log('register-yes')
            //console.log('this the this', io)
            io.emit('register-yes', post);
        }
    });

};

function profile(data) {
    var io = this.socket
    Video.find({ uploaded_by: data })
        .populate({ path: 'ratings', model: 'Rating' }).
        exec(function (err, videos) {
            if (err) { io.emit('profile-no', err); }
            //console.log('The videos are an array: ', videos);
            //io.emit('profile-yes', videos);
            console.log(io.id)
            io.emit('profile-yes', videos);
        });
};

function main() {
    var io = this.socket
    console.log(io.id)
    Video.find()
      .populate({path: 'ratings', model: 'Rating'}).
      populate({path: 'uploaded_by', model: 'Member'}).
      exec(function (err, videos) {
        if (err) {io.emit('main-no', err);}
        //console.log('The videos are an array: ', videos);
        io.emit('main-yes', videos);
      });
};

function edit(data) {
    var io = this.socket
    var ioInstance = this.ioInstance;
    Video.findById(data._id, function (err, video) {
      if (err) return handleError(err);
      video.title = data.title;
      video.save(function (err, updatedVideo) {
        if (err) {io.emit('edit-no', err);}
        else{ioInstance.emit('edit-yes', updatedVideo);}
      });
    });
};

function del(data) {
    var io = this.socket
    var ioInstance = this.ioInstance;
    console.log(data)
    Video.deleteOne({ _id: data._id }, function (err) {
    if (err) {io.emit('delete-no', err);}
        else{
        fs.unlink('public/uploads/'+data.path, (err) => {
          if (err) {io.emit('delete-no', err);}
          else{ioInstance.emit('delete-yes', data._id);}
          });
        }
      });
};

function rate(data) {
    //var io = this.socket
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
};

var Movies = function (app, socket, io) {
    this.app = app;
    this.socket = socket;
    this.ioInstance =io;
    //console.log(socket.id)
    // Expose handler methods for events
    this.handler = {
        register: register.bind(this),// use the bind function to access this.app
        main: main.bind(this),
        edit: edit.bind(this),
        rate: rate.bind(this),
        delete: del.bind(this),
        profile: profile.bind(this)    // and this.socket in events
    };
}

module.exports = Movies;
