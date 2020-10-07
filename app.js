// simple paypal checkout node script

// npm packages used
let express = require('express');
let paypal = require('paypal-rest-sdk');
let app = express();
let fs = require('fs');

// server settings
app.set('view engine', 'ejs');
app.use('/public/images/', express.static('./public/images'));
app.use('/public/css/', express.static('./public/css'));

// handle the different website handlers
app.get('/', (req, res) => {
    res.render('home')
})
app.get('/projects.ejs', (req, res) => {
    res.render('projects')
})
app.get('/home.ejs', (req, res) => {
    res.render('home')
})
app.get('/index.ejs', (req, res) => {
    res.render('index')
})
app.get('/contact.ejs', (req, res) => {
    res.render('contact')
})
// initialize express server
app.listen(80, () => {
    console.log("Server started on: localhost:80");
})
// season example 19-20
app.get('/api/premierleague/:season/standings', (req, res) => {

    var fileName = './json/' + req.params.season + '/PremierLeagueTable.json';
    fs.access(fileName, fs.constants.R_OK, (error) => {
      if(!error) {
        fs.readFile('./json/' + req.params.season + '/PremierLeagueTable.json', (err, json) => {
          let obj = JSON.parse(json);
          obj["status"] = 0;
          res.json(obj);
        });
      } else {
        console.log(error);
        res.send({status: -1});
      }  
    });
    
});

app.get('/api/premierleague/:season/week/:weekNumber', (req, res) => {
    var fileName = './json/' + req.params.season +  '/Week' + req.params.weekNumber + '.json';

    fs.access(fileName, fs.constants.R_OK, (error) => {
      if(!error) {
        console.log(fileName);
        fs.readFile(fileName, (err, json) => {
            let obj = JSON.parse(json);
            obj["status"] = 0;
            res.json(obj);
        });
      } else {
        console.log("Couldn't find data");
        res.send({status: -1});
      }
    });
    console.log("Page visited");
});
  
  app.get('/cancelled', (req, res) => res.render('projects'));