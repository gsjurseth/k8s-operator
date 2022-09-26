const express = require('express');
const fs = require('fs');
const qs = require('qs');
const axios = require('axios').default;
const { JWS, JWK } = require('node-jose');

const app = express()

const MGMT_URL='https://apigee.googleapis.com/v1/organizations';


const keyjson = fs.readFileSync('/sa/service_account.json');
const json = JSON.parse(keyjson);

const appcreds = {
    "apiVersion": "v1",
    "kind": "DeveloperAppCredential",
    "metadata": {
      "name": "replace",
    },
    "spec": {
      "name": "None",
      "consumerKey": "None",
      "developer_email": "None"
    }
};

async function getAccessToken() {
  const signingKey = await JWK.asKey(json.private_key, "pem");
  const now = Math.floor((new Date()).valueOf() / 1000);
  const lifetime = 10; // seconds
  const payload = {
          iss: json.client_email,
          scope: 'https://www.googleapis.com/auth/cloud-platform',
          aud: json.token_uri,
          exp: now + lifetime,
          iat: now
        };
  const header = {
          alg : 'RS256',
          typ : 'JWT'
        };
  let signOptions = {
        alg: header.alg,
        fields: header,
        format: 'compact'
      };
  // use reference:false to omit the kid from the header
  let signedJwt = await JWS.createSign(signOptions, [{key:signingKey, reference:false}])
    .update(JSON.stringify(payload), "utf8")
    .final();

  let accesstoken = await axios({
    "url": "https://oauth2.googleapis.com/token",
    "method": 'POST',
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded" 
    },
    data: qs.stringify({
      "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
      "assertion": signedJwt
    })
  })
  .then(res => res.data.access_token);


  return accesstoken;
} 

// Delete Apigee app, dev, and product
async function deleteApp(app, token) {
  const authHeader = `Bearer ${token}`;
  let AppURL = `${MGMT_URL}/${app.org}/developers/${app.developer_email}/apps/${app.name}`;

  delete app.org;

  let headers = {};
  headers.Authorization = authHeader;

  await axios
    .delete(AppURL, { validateStatus: false, params: {}, headers: headers })
    .then( r => {
      console.log("Deleted App");
    })
    .catch( e => {
      console.error("Error deleting app: %j", e.message);
    });
}

async function checkAppExists(app,token) {
  const authHeader = `Bearer ${token}`;
  let AppURL = `${MGMT_URL}/${app.org}/developers/${app.developer_email}/apps/${app.name}`;
  let headers = {};
  headers.Authorization = authHeader;
  headers["Content-Type"] = "application/json";

  let exists = false;
  await axios
    .get(AppURL,{ headers: headers })
    .then( async r => {
      console.log("App exists");
      exists = true;
    })
    .catch( e => {
      exists = false;
    });
  return exists;
}

// Create Apigee app, dev, and product
async function createApp(app,token) {
  const authHeader = `Bearer ${token}`;
  let AppURL = `${MGMT_URL}/${app.org}/developers/${app.developer_email}/apps`;

  let headers = {};
  headers.Authorization = authHeader;
  headers["Content-Type"] = "application/json";

  let key = null;
  console.log('about to check if app exists');

  let exists = await checkAppExists(app,token);
  if ( exists === false ) {
    console.log('about to create app');
    delete app.org;
    delete app.developer_email;

    key = await axios
      .post(AppURL, app, { headers: headers })
      .then( async r => {
        console.log("Created App");
        let key = r.data.credentials[0].consumerKey;
        await axios.post( `${AppURL}/${app.name}/keys/${key}`, { "apiProducts" : app.apiProducts }, { headers: headers } )
          .then( r => {
            console.log( "Created key and product association" );
          })
          .catch( e => {
            console.error("Error creating product association in app: %j", e);
          });
          return key;
        })
        .catch( e => {
          console.error("Error creating app: %j", e);
        });
  }
  return key;
}

// Delete Apigee app, dev, and product
async function deleteAPIProduct(product, token) {
  const authHeader = `Bearer ${token}`;
  let ProductURL = `${MGMT_URL}/${product.org}/apiproducts/${product.name}`;

  delete product.org;

  let headers = {};
  headers.Authorization = authHeader;

  await axios
    .delete(ProductURL, { validateStatus: false, params: {}, headers: headers })
    .then( r => {
      console.log("Deleted API Product");
    })
    .catch( e => {
      console.error("Error deleting apiproduct: %j", e.message);
    });
}

async function createAPIProduct(apiproduct, token) {
    const authHeader = `Bearer ${token}`;
    let ProductURL = `${MGMT_URL}/${apiproduct.org}/apiproducts`;

    delete apiproduct.org;

    let headers = {};
    headers.Authorization = authHeader;
    headers["Content-Type"] = "application/json";

    await axios
      .post(ProductURL, apiproduct, { headers: headers })
      .then( r => {
              console.log("Created API Product");
            })
      .catch( e => {
              console.error("Error creating apiproduct: %j", e);
            });
}

app.use(express.json()) // for parsing application/json

app.post('/apiproduct/sync', async function (req, res, next) {
  let obs = req.body;

  let token = await getAccessToken();

  await createAPIProduct(obs.parent.spec, token);

  let desired = { status: {}, children: [], parent: obs.parent };
  res.json(desired);
});

app.post('/apiproduct/finalize', async function (req, res, next) {
  let obs = req.body;
  let token = await getAccessToken();

  await deleteAPIProduct(obs.parent.spec, token);

  let desired = { status: {}, finalized: true, children: [] };
  res.json(desired);
});

app.post('/developerapp/sync', async function (req, res, next) {
  let obs = req.body;

  let token = await getAccessToken();

  let children = [ obs.children ];

  let app = obs.parent.spec;

  let key = await createApp(obs.parent.spec, token);

  if ( key != null) {
    let myAppCred = appcreds;
    myAppCred.spec.name = app.name;
    myAppCred.spec.developer_email = app.developer_email;
    myAppCred.spec.consumerKey = key;
    children = [ myAppCred ];
  }

  let desired = { status: { "consumerKey": key }, children, parent: obs.parent };

  res.json(desired);
});

app.post('/developerapp/finalize', async function (req, res, next) {
  let obs = req.body;
  let token = await getAccessToken();

  await deleteApp(obs.parent.spec, token);


  let desired = { status: {}, finalized: true, children: [] };
  res.json(desired);
});


app.listen(8080, function () {
  console.log('Ready')
});
