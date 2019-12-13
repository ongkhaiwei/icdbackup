'use strict';

// imports
const rest = require('restler');

// IAM Authorization Token
var authToken = null;
const authUrl = 'https://iam.cloud.ibm.com/identity/token';
const icdApiUrl = 'https://api.jp-tok.databases.cloud.ibm.com/v4/ibm/'

// Authenticate with IAM
function authenticate(icApiToken, callback) {
    console.log("\nRetrieving auth token...");
    console.log("API Token: " + icApiToken);
    console.log("Auth URL: " + authUrl);
    iamOptions.data.apikey = icApiToken
    rest.request(authUrl,
        iamOptions).on('complete',
            function (data, response) {
                //console.log(response.statusCode + " " + response.statusMessage + " " +  JSON.stringify(data));
                console.log(response.statusCode + " " + response.statusMessage);

                if (response.statusCode === 200) {
                    authToken = JSON.parse(data).access_token;
                    return callback();
                }
                else {
                    authToken = null;
                    //return callback({'errorCode': data.errorCode,'errorMessage': data.errorMessage});
                    response.statusMessage = response.statusMessage + ' (' + authUrl + ' returned error code: ' + data.errorCode + ' and error message: ' + data.errorMessage + ')';
                    return callback(response);
                }
            });
};

// Main function
function main(params) {

    const icApiToken = params.IAMToken;
    const icdDeploymentId = params.DeploymentId;

    // Time now
    var now = new Date();
    return new Promise(function (resolve, reject) {
        return authenticate(icApiToken, function (err) {
            if (err) {
                console.log(err);
                reject({ error: err });
            }
            var date = new Date();
            getLatestRun(icdDeploymentId, function (err, run) {
                if (err) {
                    reject({ error: err });
                } else {
                    resolve({ message: "Invoked at: " + date.toLocaleString(), authToken: authToken });
                }

            });

        });
    });
};

function getLatestRun(icdDeploymentId, callback) {
    console.log("IBM Cloud Database API URL: " + icdApiUrl);

    var execUrl = icdApiUrl + '/deployments/' + icdDeploymentId + '/backups';

    var options = icdOptions;
    options.headers.Authorization = 'Bearer ' + authToken;

    rest.request(execUrl,
        options).on('complete',
            function (data, response) {
                //console.log(response.statusCode + " " + response.statusMessage + " " +  JSON.stringify(data));
                //console.log(response.statusCode + " " + response.statusMessage);

                if (response.statusCode === 200) {
                    //var backups = JSON.parse(data)
                    console.log('deployments: ' + data);
                    return callback(null, null);
                }
                else {
                    //return callback({'errorCode': data.errorCode,'errorMessage': data.errorMessage});
                    response.statusMessage = response.statusMessage + ' (' + execUrl + ' returned error code: ' + data.errorCode + ' and error message: ' + data.errorMessage + ')';
                    return callback(response, null);
                }
            });
};

// REST options
const iamOptions = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    },
    method: 'POST',
    data: {
        apikey: '',
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey'
    }
};

const icdOptions = {
    headers: {
        'Authorization': authToken
    },
    method: 'POST'
};

//main(params);
exports.main = main;