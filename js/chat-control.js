const dockerCLI = require('docker-cli-js');
const dockerCompose = require('docker-compose');
const tcpPortUsed = require('tcp-port-used');
const fs = require('fs');
const axios = require('axios');
const https = require('https');
const request = require('request');

module.exports = class ChatControl {
    constructor(options) {
        this.options = options;
    }

    checkDocker() {
        const docker = new dockerCLI.Docker();
        docker.options.echo = false;

        docker.command('ps').then(function (data) {
            console.log('data = ', data);
        }).catch(function(reason) {
            console.error('This error may indicate that the docker daemon is not running: ' + reason);

            return false;
        })

        dockerCompose.version().then(function (data) {
            console.log('data = ', data);
        }).catch(function(reason) {
            console.error('This error may indicate that the docker-compose not installed: ' + reason);

            return false;
        })

        return true;
    }

    checkPortIsBusy(port) {
        return tcpPortUsed.check(port, '127.0.0.1')
            .then(function(inUse) {
                if (inUse) {
                    console.error('Port ' + port + ' in usage');
                }

                return inUse;
            }, function(err) {
                console.error('Error on check: ', err.message);

                return true;
            });
    }

    checkMatrixCert() {
        const pathToFile = this.options.dataDir + "configs\\" + this.options.domain + ".signing.key";

        const exists = fs.existsSync(pathToFile);

        if (exists) {
            console.log("file " + pathToFile +  " exists")
        } else {
            console.log("file " + pathToFile +  " not exists")
        }

        return exists;
    }

    checkHomeServerConfig() {
        const pathToFile = this.options.dataDir + "configs\\homeserver.yaml";

        const exists = fs.existsSync(pathToFile);

        if (exists) {
            console.log("file " + pathToFile +  " exists")
        } else {
            console.log("file " + pathToFile +  " not exists")
        }

        return exists;
    }

    checkSslCert() {
        const basePath = this.options.dataDir + "data\\certbot\\conf\\live\\" + this.options.domain + "\\";

        if (!fs.existsSync(basePath + "fullchain.pem") || !fs.existsSync(basePath + "privkey.pem")) {
            console.log("ssl cert doesn't exists");
            return false;
        }

        return true;
    }

    checkWhatFolderIsEmpty() {
        const dataDir = this.options.dataDir;

        fs.readdir(dataDir, function(err, files) {
            if (err) {
                console.log(err)
            } else {
                if (!files.length) {
                    console.log("folder is empty");
                } else {
                    console.log("folder is not empty");
                }
            }
        });
    }

    createFolderStructure() {
        const dataDir = this.options.dataDir;

        if (!fs.existsSync(dataDir + "\\data")) {
            fs.mkdirSync(dataDir + "\\data");
        }

        if (!fs.existsSync(dataDir + "\\configs")) {
            fs.mkdirSync(dataDir + "\\configs");
        }
    }

    downloadAndUnzipLastRelease() {
        const downloadPath = this.options.dataDir + "downloads\\";

        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath);
        } else {
            fs.rmdirSync(downloadPath, {recursive: true});
            fs.mkdirSync(downloadPath);
        }

        return axios.get("https://api.github.com/repos/yanotek/matrix-control/releases/latest").then(function(response) {
            const data = response.data;
            const zipUrl = data["zipball_url"];

            if(zipUrl) return Promise.resolve(zipUrl)

            return Promise.reject('notfound')
        }).then(function(url) {
            const file = fs.createWriteStream(downloadPath + "release.zip");

            request({
                uri: url,
                headers: {
                    'User-Agent': 'request'
                }
            }).pipe(file)
        })
    }
}

