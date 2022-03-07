 //jjjjjjjjjjjjjjjjjj
const util = require('util');
const qs = require('querystring');
const request = require('request');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const path = require('path');
const os = require('os');
const URL = require('url').URL;

const get = util.promisify(request.get);
const post = util.promisify(request.post);
const sleep = util.promisify(setTimeout);

const requestTokenURL = new URL('https://api.twitter.com/oauth/request_token');
const accessTokenURL = new URL('https://api.twitter.com/oauth/access_token');
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
 //jjjjjjjjjjjjjjjjjj

const {Autohook, validateWebhook, validateSignature} = require('..');
const dotenv = require('dotenv').config();
const url = require('url');
const ngrok = require('ngrok');
const http = require('http');

const PORT = process.env.PORT || 4242;

function sms(mm){
  return new Promise(resolve =>{
    setTimeout(()=>{
      resolve(mm);
    },2000);
  });

}

async function leermensaje(mensaje){
  /*const jsonCompleto = await JSON.stringify(body); 
  console.log(jsonCompleto['direct_message_indicate_typing_events'])
  return jsonCompleto;*/
  console.log('calling');
  const result = await sms(mensaje);
  const jsonCompleto = await JSON.stringify(result);
  return jsonCompleto; 
  
}

const startServer = (port, auth) => http.createServer((req, res) => {
  const route = url.parse(req.url, true);

  if (!route.pathname) {
    return;
  }

  if (route.query.crc_token) {
    try {
      if (!validateSignature(req.headers, auth, url.parse(req.url).query)) {
        console.error('Cannot validate webhook signature');
        return;
      };
    } catch (e) {
      console.error(e);
    }

    const crc = validateWebhook(route.query.crc_token, auth, res);
    res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(crc));
  }

  if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!validateSignature(req.headers, auth, body)) {
          console.error('Cannot validate webhook signature');
          return;
        };
      } catch (e) {
        console.error(e);
      }

      //leer evento mensaje
      const menssage = leermensaje(body);
      const sss = JSON.parse(body)
      //responder mensaje
      //console.log(typeof(sss));
      if(sss['direct_message_events']){
        console.log(sss['direct_message_events']);
        const rrr = sss['direct_message_events'];
        console.log(rrr[0]['message_create']['message_data']);
      }
      
      res.writeHead(200);
      res.end();
    });
  }
}).listen(port);

(async () => {
  try {
    /*const NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN;
    if (NGROK_AUTH_TOKEN) {
      await ngrok.authtoken(process.env.NGROK_AUTH_TOKEN);
    }
    const url = await ngrok.connect(PORT);*/
    const webhookURL = "https://lovely-deer-79.loca.lt/standalone-server/webhook";

    const config = {
      token: process.env.TWITTER_ACCESS_TOKEN,
      token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      env: process.env.TWITTER_WEBHOOK_ENV,
    };

    const server = startServer(PORT, config);


    const webhook = new Autohook(config);

    await webhook.removeWebhooks();
    await webhook.start(webhookURL);
    await webhook.subscribe({
      oauth_token: config.token,
      oauth_token_secret: config.token_secret,
    });
    
  } catch(e) {
    console.error(e);
    process.exit(-1);
  }
})();