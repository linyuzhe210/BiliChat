import 'zone.js/dist/zone-node';
import {enableProdMode} from '@angular/core';
// Express Engine
import {ngExpressEngine} from '@nguniversal/express-engine';
// Import module map for lazy loading
import {provideModuleMap} from '@nguniversal/module-map-ngfactory-loader';

import * as express from 'express';
import {join} from 'path';
import * as request from 'request';

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express server
const app = express();

const PORT = process.env.PORT || 4000;
const VERSION = 1001;
const DIST_FOLDER = join(process.cwd(), 'dist/browser');

request('https://bilichat.3shain.com/version',{json:true},(error,response,body)=>{
  if(!error&&response.statusCode==200){
    if(body.version>VERSION){
      console.info('Bilichat有更新了！前往 https://github.com/3Shain/BiliChat/releases 获取最新版！')
    }
  }
});

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {AppServerModuleNgFactory, LAZY_MODULE_MAP} = require('./dist/server/main');

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP)
  ]
}));

app.set('view engine', 'html');
app.set('views', DIST_FOLDER);

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });


app.get('/api/avatar/:userid',(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  request('https://api.bilibili.com/x/space/acc/info?mid='+req.params.userid,{json:true},(error,response,body)=>{
      if(!error&&response.statusCode==200){
          request(body.data.face,{encoding:null},(error2,response2,body2)=>{
              if(!error2&&response2.statusCode==200){
                  res.type(response2.headers['content-type'])
                  res.send(body2)
              }
              else{
                  res.sendStatus(404)
              }
          });
      }
      else{
          res.sendStatus(404);
      }
  })
});

app.get('/api/stat/:roomid',(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  request('https://api.live.bilibili.com/room/v1/Room/room_init?id='+req.params.roomid,{json:true},(error,response,body)=>{
      if(!error&&response.statusCode==200){
          res.send(body.data)
      }else
      {
          res.sendStatus(404);
      }

  })
});

// Serve static files from /browser
app.get('*.*', express.static(DIST_FOLDER, {
  maxAge: '1y'
}));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Bilichat正运行在 http://localhost:${PORT}`);
  console.log(`在浏览器或OBS浏览器源中输入URL为http://localhost:${PORT}/alpha/[你的直播间地址] 即可`);
});
