import App from './App';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import express from 'express';
import { renderToString } from 'react-dom/server';
import routes from './routes';
import transactions from './classes/transactions';
import bcash from './classes/bcash';

console.log('running scheduler');
transactions.run();

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

const server = express();
server.use('/', routes);
server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get('/*', (req, res) => {
    const context = {};
    const markup = renderToString(
      <StaticRouter context={context} location={req.url}>
        <App />
      </StaticRouter>
    );

    if (context.url) {
      res.redirect(context.url);
    } else {
      res.status(200).send(
        `<!doctype html>
          <html lang="">
          <head>
              <meta http-equiv="X-UA-Compatible" content="IE=edge" />
              <meta charset="utf-8" />
              <title>Krave | Cash Account scheduler</title>
              <meta name="viewport" content="width=device-width,minimum-scale=1.0,initial-scale=1,user-scalable=no">
              ${
                assets.client.css
                  ? `<link rel="stylesheet" href="${assets.client.css}">`
                  : ''
              }
              ${
                process.env.NODE_ENV === 'production'
                  ? `<script src="${assets.client.js}" defer></script>`
                  : `<script src="${
                      assets.client.js
                    }" defer crossorigin></script>`
              }
              <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
              <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
              <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
              <link rel="manifest" href="/site.webmanifest">
              <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
              <meta name="msapplication-TileColor" content="#da532c">
              <meta name="theme-color" content="#ffffff">
          </head>
          <body>
              <div id="root">${markup}</div>

              <script async src="https://www.googletagmanager.com/gtag/js?id=UA-132120229-1"></script>
              <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', 'UA-132120229-1');
              </script>

          </body>
        </html>`
      );
    }
  });

export default server;
