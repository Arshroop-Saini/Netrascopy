const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const http = require('http');
const fs = require('fs');
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

// Using Auth0 for authentication
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'https://netrascopy.herokuapp.com',
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
  prediction: {type:Number, required:true},
  name:{type:String,required:true},
  age:{type:Number,required:true},
  gender:{type:String,required:true},
  home:{type:String,required:true},
  date:{type:Date,required:true},
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
  
    const file = req.files.image;
    cloudinary.uploader.upload(file.tempFilePath,(err,result)=>{
      
      console.log(result.url);
      // Flask API Request here
      var options = {
        'method': 'POST',
        'url': 'https://iris-detection-isef.herokuapp.com/predict',
        'headers': {
        },
        formData: {
          'url': result.url
        }
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        const x=response.body;
      // Converting JSON-encoded string to JS object
      var obj = JSON.parse(x);
      // Accessing individual value from JS object
      var answer=obj.prediction; // Outputs: value
      home=""
      if (answer==0) {
        var home="Don't Have Diabetic Ratinopathy"
      } else {
        var home="Have Diabetic Ratinopathy"
      }
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();
      
      newdate = year + "/" + month + "/" + day;
      console.log(answer)

        const post = new Post({
          imagePath: result.url,
          prediction: answer,
          name:req.body.name,
          gender:req.body.gender,
          home:home,
          date:newdate,
          age:req.body.age,
        });
      post.save(function(err,result){
        if (!err){
          const postId= result._id;
          const x=result.prediction;
          res.redirect("/result/"+postId+"/"+x);
        }
      });
    });
  });
    });

app.get("/result/:postId/:x",requiresAuth(), function(req, res){
  const requestedPostId = req.params.postId;
  const answer= req.params.x
  var ans=""
  if (answer==0) {
    var ans="You Don't have Diabetic Ratinopathy"
  } else {
    var ans="You Have Diabetic Ratinopathy"
  }
  // Rest API here
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("result", {
      url: post.imagePath,
      answer:ans,
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
  