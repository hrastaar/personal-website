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

    fs.readFile('./json/' + req.params.season + '/PremierLeagueTable.json', (err, json) => {
        let obj = JSON.parse(json);
        res.json(obj);
    });
});

app.get('/api/premierleague/:season/week/:weekNumber', (req, res) => {
    var fileName = './json/' + req.params.season +  '/Week' + req.params.weekNumber + '.json';
    console.log(fileName);
    fs.readFile(fileName, (err, json) => {
        let obj = JSON.parse(json);
        res.json(obj);
    });
});

// post request for when user presses donate button on locahost:3000/
app.get('/donate', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:80/success",
            "cancel_url": "http://localhost:80/cancelled"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "5 Dollar Donation",
                    "sku": "001",
                    "price": "5.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "5.00"
            },
            "description": "Donate to the developers of this app"
        }]
    }

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for(let i = 0;i < payment.links.length;i++){
                if(payment.links[i].rel === 'approval_url'){
                res.redirect(payment.links[i].href);
                }
            }
        }
    });
});


// set up sandbox paypal sdk with my business account
paypal.configure({
    'mode': 'sandbox', // OPTIONS: sandbox, or live
    'client_id': 'AV5n0ECAd0lFV-ane6nfVt1oPCBt97oaJQP8RYzrEq3YdE6G9hAmspLK-d7CujbOXgIf80FpGXAdgIIu',
    'client_secret': 'EDaHfl0W72tmdKNuf3UHWM6hc2iix69LMsDruTYJaSzPLNwhCi5rW0pnoCq7QOdwAwHRHatBCmCVtR2G'
});

  
app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": "5.00"
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log(JSON.stringify(payment));
          res.render('success');
      }
  });
  });
  
  app.get('/cancelled', (req, res) => res.render('projects'));