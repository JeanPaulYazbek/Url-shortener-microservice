'use strict';
//iniciamos todas las depencias que necesitamos
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');
var app = express();

var Schema = mongoose.Schema;

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
  mongoose.Promise = global.Promise; // ADD THIS
mongoose.connect(process.env.MONGO_URI);

//creamos el esquema de url
var urlSchema = new Schema({
  id: Number,
  url: String
})

//creamos el modelos de urls
var urlModel = mongoose.model('Url',urlSchema);

app.use(cors());
app.use(bodyParser());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// posting a new url to db
app.post("/api/shorturl/new", function (req, res) {
  let original = req.body;
  let theData;
  
  //reg exp para encontrar https://www. o http://www.
  let urlRegex = /https:\/\/www.|http:\/\/www./g;
  //revisamos si podemos conectar 
  dns.lookup(req.body.url.replace(urlRegex, ''), (err, address, family) => {
    if (err) {
      res.json({"error": err});
    } else {
      onComplete();
    }
  });

  function onComplete(){
    urlModel.find()//buscamos el modelos 
      .exec()//ejecutamos en el lo sgte
      .then(docs => {
        theData = docs;//guardamos las instancias del modelo
        var doc = new urlModel({ "id":theData.length, "url": req.body.url });
        theData = theData.filter((obj) => obj["url"] === req.body.url);//buscamos instancia con el mismo url
        //revisamos si ya esta
        if ( theData.length === 0 ) {//si no
          doc.save()//guardamos el nuevo
          .then(result => {
            res.json(result);
          })
          .catch(err => {
            console.log(err)
            res.json({"error": err});
          });
        } else {//si lo esta
          res.json({"error": `URL already in database as ${theData[0].id}`});
        }    
      })
      .catch(err => {
        console.log(err);
        res.json({ "error": err });
      });
  };
});


// esto solo te muestra los url que ya has hecho
app.get("/api/shorturl", function (req, res) {
  urlModel.find()
    .exec()
    .then(docs => {
      res.json(docs);
    })
    .catch(err => {
      console.log(err);
      res.json({ "error": err });
    });
});

// aqui podemos solicitar un link por shortcut
app.get("/api/shorturl/:short", function (req, res) {
  console.log(req.params.short);
  let short = req.params.short;
  urlModel.find({ "id": short }).exec()
    .then(docs => {
      res.redirect(docs[0]["url"]);
    })
    .catch(err => {
      console.log(err);
      res.json({ "error": err });
    })
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});