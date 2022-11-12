const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const http = require('http');
const fs = require('fs');
var request = require('request');
require('dotenv').config();
const util= require('util');
const unlinkFile= util.promisify(fs.unlink);;
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const { auth, requiresAuth } = require('express-openid-connect');
const methodOverride= require("method-override")
const favicon= require('serve-favicon');
const path= require('path');
const { log } = require("console");
const axios = require("axios");
const { range } = require("lodash");
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBK8LMPL1YabnsygIzuZ75SqP3Bruqq2Y",
  authDomain: "netrascopy.firebaseapp.com",
  projectId: "netrascopy",
  storageBucket: "netrascopy.appspot.com",
  messagingSenderId: "17299466664",
  appId: "1:17299466664:web:18fd67db0187487ce8959d",
  measurementId: "G-HH8P0WM1FV"
};

// Initialize Firebase
const appy = initializeApp(firebaseConfig);
const analytics = getAnalytics(appy);

var database = firebase.database();
var prediction = database.ref('prediction');


// Using Auth0 for authentication
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:8000',
  clientID: 'Vjq6fbuba65JwyPOrEaShTFUPGkGxcq3',
  issuerBaseURL: 'https://dev-hri34pn2.us.auth0.com'
};

// Using cloudinary library for hosting images path and then storing images path in mongodb database.
cloudinary.config({ 
  cloud_name: 'woofyverse',
  api_key: '812158734764712', 
  api_secret: 'aG5zKoQB1iX2tnqZVfmUsqVOKNU' 
});

const port= process.env.PORT || 8000;
const app = express();
app.use(auth(config));
app.use(fileUpload({
  useTempFiles:true
}));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride('_method'));

// Connecting with our mongodb database
mongoose.connect("mongodb+srv://netra:Asdfjkl123@netra.pxrnajt.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const postSchema ={
  imagePath:{type:String,required:true},
  prediction: {type:String, required:false},
  name:{type:String,required:true},
  age:{type:Number,required:true},
  gender:{type:String,required:true},
  home:{type:String,required:false},
  date:{type:Date,required:false},
  description:{type:String,required:true},
}

const Post = mongoose.model("Post", postSchema);

app.get('/',function (req,res) {
    res.render('home',{
      text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
    })
});

app.get('/predict',function (req,res) {
    res.render('predict',{
      text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
    })
  })

app.post("/predict", requiresAuth(),function(req, res){
    const file = req.files.video;
    cloudinary.uploader
    .upload(file.tempFilePath,{
      resource_type:"video"
    })
    .then((result)=>{console.log(result.url)
      // Flask API Request here
      var options = {
        'method': 'POST',
        'url': 'http://127.0.0.1:5000/generate',
        'headers': {
        },
        formData: {
          'url': result.url
        }
      };
      request(options, function (error, response, input) {
        if (error) throw new Error(error);
        const x=response.body;
      // Converting JSON-encoded string to JS object
      var obj = JSON.parse(x);
      console.log(obj)
      for (let i = 0; i < obj.length; i++) {
        var link= obj[i]
        var options = {
          'method': 'POST',
          'url': 'https://iris-detection-isef.herokuapp.com/predict',
          'headers': {
          },
          formData: {
            'url': link
          }
        };
        request(options, function (error, response) {
          if (error) throw new Error(error);
          console.log(response.body);
          const y=response.body;
          var cjs = JSON.parse(y);
          var answer=cjs.prediction; // Outputs: value
          var yes=0
          var no= 0
      if (answer==0){
        var no = no+1
      } 
       else {
        var yes = yes+1
      }
        var value1="nul"
        var description1= `From ${no+yes} test cases you were diagnosed with diabetic retinopathy in ${yes} test cases and you were not diagnosed with diabetic retinopathy in ${no} test cases.`
        if (no>yes){
          var value1="Don't Have Diabetic Ratinopathy"
        }else{
          var value1="Have Diabetic Ratinopathy"
        }
    
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();
      var value2 = year + "/" + month + "/" + day;

      var data = {
        value1: value1,
        value2: value2,
        description1: description1,
      }
      prediction.push(data, finished);
      function finished(error) {
        if (error) {
          console.log('ooops');
        } else {
          console.log('data saved!');
        }
      }
})  
} 
      var ref = database.ref("prediction");
      ref.on("value", gotData, errData);
      function gotData(data) {
        var prediction = data.val();
        // Grab the keys to iterate over the object
        var keys = Object.keys(prediction);
      
        for (var i = 0; i < keys.length; i++) {
          var key = keys[keys.length];
          // Look at each fruit object!
          var prediction = prediction[key];
        }
        console.log(prediction)
      const post = new Post({
        imagePath: result.url,
        description:description1,
        prediction: value1,
        name:req.body.name,
        gender:req.body.gender,
        home:value1,
        date:value2,
        age:req.body.age,
      });
      console.log(post)
      post.save(function(err,result){
      if (!err){
        console.log(result)
        const postId= result._id;
        const x=result.prediction;
        res.redirect("/result/"+postId+"/"+x);
      }
      });
    } //this is the end of firebase function
    });
  })
    });

app.get("/result/:postId/:x",requiresAuth(), function(req, res){
  const requestedPostId = req.params.postId;
  const answer= req.params.x
  // Rest API here
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("result", {
      url: post.imagePath,
      answer:answer,
      text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
    });
  });
});

app.get('/diagnosis',requiresAuth(),function (req,res){
  Post.find({},function(err,post){
    res.render('diagnosis',{
    post:post,
    text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
    })
  }).sort({date:"desc"})
})

app.listen(port, function() {
    console.log(`Server started sucessfully at` + {port});
  });
