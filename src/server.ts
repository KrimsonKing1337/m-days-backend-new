import path from 'path';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import bodyParser from 'body-parser';

import { router } from './routes/main/main.js';
import { asImageRouter } from './routes/asImage/asImage.js';

const app = express();

// const port = process.env.NODE_ENV === 'production' ? 80 : 3000;
const port = 3000;

// const rateLimit = require('express-request-limit');

const rateLimitOpts = {
  timeout: 1000 * 5,
  exactPath: true,
  cleanUpInterval: 0,
  errStatusCode: 429,
  errMessage: 'Too many requests made to this route'
};

const webRoot = path.resolve('../');

if (!webRoot) {
  console.error('webRoot does not specified!');
}

app.use(compression({ filter: () => true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(helmet.hidePoweredBy());
app.disable('x-powered-by');

/*
* здесь была промежуточная страница, которая просто переадресовывала в /legacy.
* наверное, я хотел определять устройство и перекидывать на нужную версию автоматически,
* но react версию я вообще не использую, так что и смысла нет.
* но, возможно, потом пригодится, если захочу переадресовывать в /u
*/
// app.use('/', express.static(path.join(webRoot, '')));

// не помню зачем нужен m-days-public, если он дублирует dist
// app.use(express.static(path.join(webRoot, 'm-days-public')));
app.use(express.static(path.join(webRoot, 'm-days-public-images')));

app.use('/', express.static(path.join(webRoot, 'm-days-fe-widget/dist')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', 'src/views');
app.set('view engine', 'ejs');

app.use(router);
app.use(asImageRouter);

app.listen(port, () => {
  console.log(`We are living on ${port}`);
});
