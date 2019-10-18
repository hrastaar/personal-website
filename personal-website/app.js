// simple paypal checkout node script

// npm packages used
let express = require('express');
let paypal = require('paypal-rest-sdk');
let app = express();
let fs = require('fs');
let https = require('https');
let simpleGET = require('simple-get');
const rp = require('request-promise');


// server settings
app.set('view engine', 'ejs');
app.use('/public/images/', express.static('./public/images'));
app.use('/public/css/', express.static('./public/css'));

// all the different region servers
let region = ["br1", "eune1", "euw1", "kr", "la1", "la2", "na1", "oce1", "tr1", "ru", "pbe1"];
let summonerURL = ".api.riotgames.com/lol/summoner/v4/summoners/";
// API key used to gather Riot Games player data
let api = "?api_key=RGAPI-ba836c2b-1583-409d-808b-aa2f0a252988"

// SERVER IS BY DEFAULT SET UP ON PORT 80
const port = 80;

https.createServer({
    key: fs.readFileSync('../key.pem'),
    cert: fs.readFileSync('../cert.pem'),
    passphrase: 'palmtrees'
}, app).listen(port);


/*
    FUNCTION TO RETURN SUMMONERID FROM THE USERNAME AND SERVER ENTERED

    Step 1: make GET REQUEST:    https://{server}.api.riotgames.com/lol/summoner/v4/summoners/by-name/rastaar?{api}

            return the resulting string that is the summonerID

*/
app.get("/na1/:name", function(req, res) {
    let server = 'na1';
    let currURL = 'https://' + server + summonerURL + 'by-name/' + req.params.name + api
    rp(currURL).then(result=> {
        res.send(result);
    }).catch(err => {
        console.log("couldnt find username in server");
        res.send("ERROR FINDING USER")
    });
});

/*  
    FUNCTION TO GATHER LIVE PLAYER DATA AND RETURN IN A JSON FILE 

    Step 1: is to get the SummonerID from the username and user input

    Step 2: Then call the /lol/spectator/v4/active-games/by-summoner/{encryptedSummonerId}
           to gather a bunch of the streamer's live data
*/

app.get("/na1/gameData/:summonerID", function(req, res) {
    let server = 'na1';
    let currURL = 'https://' + server + '.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/' + req.params.summonerID + api;
    rp(currURL).then(data=> {
    data = JSON.parse(data);
    let myTeamRoster = [];
    let enemyTeamRoster = []
    let myTeamID = -1;
    // find out which team we are on, runtime O(N), where N = 10
    for(let i = 0; i < data.participants.length; i++) {
        if(data.participants[i].summonerId == req.params.summonerID) {
            myTeamID = data.participants[i].teamId;
            break;
        }
    }
    if(myTeamID === -1) {
        console.log("Problem finding current user in participants arr")
        return -1;
    }
    // now push each player onto each teams' array
    for(let i = 0; i < data.participants.length; i++) {
        /*
            Example of a participants' data structure: 
                { teamId: 200,
                    spell1Id: 4,
                    spell2Id: 14,
                    championId: 80,
                    profileIconId: 4292,
                    summonerName: 'awesomeUsername',
                    bot: false,
                    summonerId: 'My Riot Summoner Id',
                    gameCustomizationObjects: [],
                    perks: [Object] }

        */
        if(data.participants[i].teamId === myTeamID) {
            myTeamRoster.push(data.participants[i]);
        } else {
            enemyTeamRoster.push(data.participants[i]);
        }
    }

    // resulting information to return
    let matchSummary = {"MapId": data.mapId, 
                        "gameMode": data.gameMode, 
                        "gameType": data.gameType, 
                        "myTeam": myTeamRoster, 
                        "enemyTeam": enemyTeamRoster };                   
    res.send(matchSummary);// matchSummary;
                
    }).catch(err => {
        console.log("couldnt find username in server");
        res.send("ERROR FINDING USER")
    });
})

/* RETURN VALUE DEFINITIONS: 
    0 : bad server name (shouldn't happen because we call the getSummonerID function prior)
    -1 : Player not in match right now, no live data to share
    Promise Object : contains the data we care about
*/


async function getLiveGameData(summonerID, server) {
    // if invalid server region, print an error message and return
    if(!region.includes(server)) {
        console.log("Unable to understand input server: ", server);
        return 0;
    } 
    else {
        // create our GET Request using the simple-get npm package, has 1 second delay
        const opts = {
            method: 'GET',
            url: 'https://' + server + '.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/' + summonerID + api,
            timeout: 1000,
            json: true
            }
            simpleGET.concat(opts, function (err, res, data) {
                if (err) throw err
                console.log(data) // `data` is an object
                if(data.status.message === ('Data not found')) {
                    console.log("Player is not in a match right now, no live match data to share");
                    return -1;
                } else {

                    let myTeamRoster = [];
                    let enemyTeamRoster = []
                    let myTeamID = -1;
                    // find out which team we are on, runtime O(N), where N = 10
                    for(let i = 0; i < data.participants.length; i++) {
                        if(data.participants[i].summonerId === summonerID) {
                            myTeamID = data.participants[i].teamId;
                            console.log("My Team ID: ", myTeamID);
                            break;
                        }
                    }
                    if(myTeamID === -1) {
                        console.log("Problem finding current user in participants arr")
                        return -1;
                    }
                    // now push each player onto each teams' array
                    for(let i = 0; i < data.participants.length; i++) {
                        /*
                            Example of a participants' data structure: 
                                { teamId: 200,
                                    spell1Id: 4,
                                    spell2Id: 14,
                                    championId: 80,
                                    profileIconId: 4292,
                                    summonerName: 'awesomeUsername',
                                    bot: false,
                                    summonerId: 'My Riot Summoner Id',
                                    gameCustomizationObjects: [],
                                    perks: [Object] }

                        */
                        if(data.participants[i].teamId === myTeamID) {
                            myTeamRoster.push(data.participants[i]);
                        } else {
                            enemyTeamRoster.push(data.participants[i]);
                        }
                    }

                    // resulting information to return
                    let matchSummary = {"MapId": data.mapId, 
                                        "gameMode": data.gameMode, 
                                        "gameType": data.gameType, 
                                        "myTeam": myTeamRoster, 
                                        "enemyTeam": enemyTeamRoster };
                                        
                    return matchSummary;
                }
            })
            
    }
}
// process.on('unhandledRejection', (reason, promise) => {
//     console.log('Unhandled Rejection at:', reason.stack || reason)
//     // Recommended: send the information to sentry.io
//     // or whatever crash reporting service you use
//   })


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
// app.listen(80, () => {
//     console.log("Server started on: localhost:80");
// })

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