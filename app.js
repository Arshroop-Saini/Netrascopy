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
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/*const firebaseConfig = {
  apiKey: "AIzaSyCBK8LMPL1YabnsygIzuZ75SqP3Bruqq2Y",
  authDomain: "netrascopy.firebaseapp.com",
  projectId: "netrascopy",
  storageBucket: "netrascopy.appspot.com",
  messagingSenderId: "17299466664",
  appId: "1:17299466664:web:18fd67db0187487ce8959d",
  measurementId: "G-HH8P0WM1FV"
};*/

// Initialize Firebase
/*const appy = initializeApp(firebaseConfig);
const analytics = getAnalytics(appy);

var database = firebase.database();
var prediction = database.ref('prediction');
*/

// Using Auth0 for authentication
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:9200',
  clientID: 'Vjq6fbuba65JwyPOrEaShTFUPGkGxcq3',
  issuerBaseURL: 'https://dev-hri34pn2.us.auth0.com'
};

// Using cloudinary library for hosting images path and then storing images path in mongodb database.
cloudinary.config({ 
  cloud_name: 'woofyverse',
  api_key: '812158734764712', 
  api_secret: 'aG5zKoQB1iX2tnqZVfmUsqVOKNU' 
});

const port= process.env.PORT || 9200;
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
        'url': 'https://frames-api-netrascopy.onrender.com/generate',
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
      var link1= obj[0]
      var link2= obj[1]
      var link3= obj[2]
      var link4= obj[3]
      var link5=obj[4]
      var link6=obj[5]
      var link7=obj[6]
      var link8=obj[7]
      var link9=obj[8]
      var link10=obj[9]
        var options = {
          'method': 'POST',
          'url': 'http://127.0.0.1:5000/predict',
          'headers': {
          },
          formData: {
            'url1':link1,
            'url2':link2,
            'url3':link3,
            'url4':link4,
            'url5':link5,
            'url6':link6,
            'url7':link7,
            'url8':link8,
            'url9':link9,
            'url10':link10,
          }
        };
        request(options, function (error, response) {
          if (error) throw new Error(error);
          console.log(response.body);
          const y=response.body;
          var cjs = JSON.parse(y);
          var ones=cjs.ones;
          var zeros= cjs.zeros;
           // Outputs: value
          var twos= cjs.twos;
          var threes= cjs.threes;
          var fours= cjs.fours;
        var value1="nul"
        var description1= `From ${zeros+ones+twos+threes+fours} test cases you were diagnosed with No DR in ${zeros} test cases, Proliferated Diabetic Retinopathy in ${fours} test cases, Mild Diabetic Retinopathy in ${ones} test cases, Moderate Diabetic Retinopathy in ${twos}, Severe Diabetic Retinopathy in ${threes}, Proliferated Diabetic Retinopathy in ${fours} test cases.`
        if (zeros>ones && zeros>twos && zeros>threes &&zeros>fours){
          var value1="YOU HAVE NO DIABETIC RATINOPATHY. No need to worry, just take a balanced diet and avoid access sugar intake."
        }
        else if(twos>ones && twos>zeros && twos>threes &&twos>fours){
          var value1="YOU HAVE MILD DIABETIC RATINOPATHY. This is the earliest stage of diabetic retinopathy, characterized by tiny areas of swelling in the blood vessels of the retina. These areas of swelling are known as micro aneurysms. Small amounts of fluid can leak into the retina at the stage, triggering swelling of the macula. This is an area near the center of the retina."
        }
        else if(threes>ones && threes>zeros && threes>twos &&threes>fours){
          var value1="YOU HAVE MODERATE DIABETIC RATINOPATHY. Increased swelling of tiny blood vessels starts to interfere with blood flow to the retina, preventing proper nourishment. This causes an accumulation of blood and other fluids in the macula."
        }
        else if(ones>twos && ones>zeros && ones>threes &&ones>fours){
          var value1="YOU HAVE SEVERE DIABETIC RATINOPATHY. A larger section of blood vessels in the retina become blocked, causing a significant decrease in blood flow to this area. At this point, the body receives signals to start growing new blood vessels in the retina."
        }
        else{
          var value1="YOU HAVE PROLIFERATED DIABETIC RATINOPATHY. This is an advanced stage of the disease, in which new blood vessels form in the retina. Since these blood vessels are often fragile, there's a higher risk of fluid leakage. This triggers different vision problems such as blurriness, reduced field of vision, and even blindness."
        }
    
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();
      var value2 = year + "/" + month + "/" + day;
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
})  
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
      description:post.description,
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
});

app.get('/research-paper',function(req,res){
  res.render('research-paper',{
    text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
  });
})

app.listen(port, function() {
    console.log(`Server started sucessfully at` + {port});
  });
