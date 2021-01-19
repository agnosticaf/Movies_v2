import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class MovieService {

  constructor(private http: Http) { }

  videoUpload(data) {
    return new Promise((resolve, reject) => {
        var formData: FormData = new FormData();
        formData.append('title', data.title);
        formData.append('uploaded_by', data.uploaded_by);
        formData.append('file', data.file, data.file.name);
        //console.log(file)
        var headers = new Headers();
        headers.append('Accept', 'application/json');
        this.http.post('http://localhost:3000/movie/upload', formData)
          .map(res => res.json())
          .subscribe(res => {
            resolve(res);
          }, (err) => {
            reject(err);
          });
    });
  }

  loginUser(data) {
    return new Promise((resolve, reject) => {
        this.http.post('http://localhost:3000/movie/login', data)
          .map(res => res.json())
          .subscribe(res => {
            resolve(res);
          }, (err) => {
            reject(err);
          });
    });
  }

  private handleError(error: any): Promise<any> {
    return Promise.reject(error.message || error);
  }

}
