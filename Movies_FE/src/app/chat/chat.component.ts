import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../chat.service';
import * as io from "socket.io-client";
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {

  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  @ViewChild('btnClose') btnClose: ElementRef;
  error= '';
  current = '';
  logged: boolean = false;
  admin: boolean = false;
  user: any;
  myVideos: any;
  allVideos: any;
  videoToRate: any;
  video = { file: File = null, title: '', uploaded_by: ''};
  newUser = { nickname: '', room: '', username: '', password: '' };
  socket = io('http://localhost:4000');

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    console.log('this user is = ' + this.user);
    var user = JSON.parse(localStorage.getItem('user'));
    if (user !== null) {
      this.user = user;
      console.log(this.user);
      this.logged = true;
      this.profile();
    }

    this.socket.on('uploaded', function (data) {
        console.log(data);
        this.error = JSON.stringify(data);
    }.bind(this));

    this.socket.on('register-no', function (data) {
        this.error = 'Username already in use';
    }.bind(this));

     this.socket.on('register-yes', function (data) {
        console.log(data)
        localStorage.setItem("user", JSON.stringify(data));
        this.user = data;
        this.logged = true;
        this.profile();
    }.bind(this));

    this.socket.on('profile-yes', function (data) {
        for (const key in data) {
        var ra_count  = 0;
        var ra_sum = 0;
            for (const v of data[key].ratings) {
              ra_count++;
              ra_sum = ra_sum + v.rating;
            console.log(v.rating);
            }
            data[key].rating = ra_sum / ra_count;
        }
        console.log(data);
        this.myVideos = data;
    }.bind(this));

    this.socket.on('profile-no', function (data) {
        console.log(data);
    }.bind(this));
        this.socket.on('main-yes', function (data) {
        for (const key in data) {
        var ra_count  = 0;
        var ra_sum = 0;
            for (const v of data[key].ratings) {
              ra_count++;
              ra_sum = ra_sum + v.rating;
            console.log(v.rating);
            }
            data[key].rating = ra_sum / ra_count;
        }
        console.log(data);
        this.allVideos = data;
    }.bind(this));

    this.socket.on('main-no', function (data) {
        console.log(data);
    }.bind(this));

    this.socket.on('edit-no', function (data) {
        console.log(data);
        this.error = data;
    }.bind(this));

     this.socket.on('edit-yes', function (data) {
        console.log(data);
        this.profile();
    }.bind(this));

     this.socket.on('delete-no', function (data) {
        console.log(data);
    }.bind(this));

     this.socket.on('delete-yes', function (data) {
       this.profile();
        console.log(data);
    }.bind(this));

    this.socket.on('rate-no', function (data) {
        console.log(data);
    }.bind(this));

     this.socket.on('rate-yes', function (data) {
         console.log(data);
        var ra_count  = 0;
        var ra_sum = 0;
        for (const v of data.ratings) {
          ra_count++;
          ra_sum = ra_sum + v.rating;
        console.log(v.rating);
        }
        console.log(ra_sum / ra_count);
        var videos: any;
        if (this.current === 'profile'){
            videos = this.myVideos;
        }else{
            videos = this.allVideos;
        }
       for (const key in videos) {
            if (videos[key]._id === data._id)
            videos[key].rating = ra_sum / ra_count;
        }
        console.log(videos);
    }.bind(this));
  }

  ngAfterViewChecked() {
    console.log('after view checked');
  }
  profile() {
    console.log(this.user)
    this.current = 'profile';
    this.socket.emit('profile', this.user._id);
  }

  main() {
    console.log('main function')
    this.current = 'main';
    this.socket.emit('main');
  }

  editPage(video) {
    console.log('edit page')
    this.current = 'edit';
    this.video = video;
  }

  createVideo() {
    console.log('upload function')
    this.current = 'upload';
    //this.socket.emit('profile', this.user._id);
  }

  toRate(video) {
    this.videoToRate = video;
    console.log(video.ratings);
  }

  rate(rateForm) {
    console.log(rateForm.value.rating);
    this.btnClose.nativeElement.click();
    var rating = { rating: rateForm.value.rating, rated_by: this.user._id, video_rated: this.videoToRate._id};
    //this.current = 'upload';
    this.socket.emit('rate', rating);
    rateForm.resetForm();
  }

  createLogin() {
    var date = new Date();
     if (
      this.newUser.username &&
      this.newUser.password ) {
          //var userData = { room: '1', nickname: '2', message: '3' };
          var userData = { username: this.newUser.username, password: this.newUser.password };
          this.socket.emit('register', userData);
  }}

   login() {
     if (
      this.newUser.username &&
      this.newUser.password ) {
       //console.log(this.newUser);
      var userData = { username: this.newUser.username, password: this.newUser.password };
      this.chatService.loginUser(userData).then((res) => {
        console.log(res)
        localStorage.setItem("user", JSON.stringify(res));
        this.user = res;
        this.logged = true;
        this.profile();
        //this.users = res;
        //this.socket.emit('save-message', res);
      }, (err) => {
        console.log(err);
        this.error = 'password doesn\'t match';
      });
  }}

  handleFileInput(files: FileList) {
      this.video.file = files.item(0);
  }

  upload() {
    console.log(this.user);
    this.video.uploaded_by = this.user._id;
    this.chatService.videoUpload(this.video).then((res) => {
      this.socket.emit('profile', this.user._id);
      this.socket.emit('main');
      console.log(res);
      }, error => {
      this.error = 'Title already taken';
        console.log(error);
      });
  }

  edit() {
    this.socket.emit('edit', this.video);
  }
  delete(video) {
    this.socket.emit('delete', video);
  }

  logout() {
    //var date = new Date();
    var user = JSON.parse(localStorage.getItem("user"));
    //this.socket.emit('save-message', { room: user.room, nickname: user.nickname, message: 'Left this room', updated_at: date });
    localStorage.removeItem("user");
    this.logged = false;
    this.current = '';
  }

}
