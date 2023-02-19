/*********************************************************************************
 *  WEB322 – Assignment 03
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
 *  of this assignment has been copied manually or electronically from any other source 
 *  (including 3rd party web sites) or distributed to other students.
 * 
 *  Name: ____Emiliya Aghayeva__________________ Student ID: _____148398217_________ Date: ______19.02.2023__________
 *
 *  Online (Cyclic) Link: ________________________________________________________
 *
 ********************************************************************************/



var express = require('express');
var app = express();
var path = require("path");
var blogService = require("./blog-service");
const fs = require('fs');

const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

const bodyparser = require('body-parser');
app.use(express.static('public'))
app.use(bodyparser.json());

var HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
    cloud_name: 'dp3hbncmb',
    api_key: '283872449448813',
    api_secret: '4ShBBtluuAOtsoorh5iFS7YVEiw',
    secure: true
});

const upload = multer();

function onHttpStart() {
    console.log("Express http server listening on:  " + HTTP_PORT);
}


app.get('/', (req, res) => {
    res.redirect('/about');
});

app.get("/about", function(req, res) {
    res.sendFile(path.join(__dirname, "/views/about.html"));
});


app.get("/blog", function(req, res) {
    blogService.getPublishedPosts()
        .then((posts) => {
            res.send(posts);
        })
        .catch((err) => {
            res.send({ message: err });
        });
});

app.get("/posts", function(req, res) {
    let queryPromise = null;

    // by category query 
    if (req.query.category) {
        queryPromise = blogService.getPostsByCategory(req.query.category);
        // by mindate Query 
    } else if (req.query.minDate) {
        queryPromise = blogService.getPostsByMinDate(req.query.minDate);
        //all posts 
    } else {
        queryPromise = blogService.getAllPosts()
    }

    queryPromise.then(data => {
        res.send(data)
    }).catch(err => {
        res.render("No Posts Found");
    })
});

app.get("/categories", function(req, res) {
    blogService.getCategories()
        .then((categories) => {
            res.send(categories);
        })
        .catch((err) => {
            res.send({ message: err });
        });
});

app.get('/posts/add', (req, res) => {
    res.sendFile(path.join(__dirname, "/views/addPost.html"));
});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {

    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
    }

    upload(req).then((uploaded) => {
        req.body.featureImage = uploaded.url;
        // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts

        var postData = req.body;
        blogService.addPost(postData).then(data => {
            res.redirect('/posts');
        }).catch(err => {
            res.send(err);
        });


    });


});

app.get("*", (req, res) => {
        res.status(404).send("Page not found");
    }) // if no matching route is found default to 404 with message "Page Not Found"



blogService.initialize().then(() => {
    app.listen(HTTP_PORT, onHttpStart);

}).catch(() => {
    console.log("error");
});