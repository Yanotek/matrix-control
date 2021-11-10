const dockerCLI = require('docker-cli-js');
const dockerCompose = require('docker-compose');
const tcpPortUsed = require('tcp-port-used');
const fs = require('fs');
const axios = require('axios');
const extractZip = require('extract-zip');

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

    installLastRelease() {
        const chat = this;

        return chat.downloadAndUnzipLastRelease().then(function () {
            chat.createFolderStructure();

            const parameters = {
                "#DOMAIN": chat.options.domain,
                "#PORT": chat.options.port
            }

            return chat.copyTemplates(parameters);
        }).then(function () {
            chat.removeDownloads();
        }).then(function () {

        });
    }

    createFolderStructure() {
        const dataDir = this.options.dataDir;

        if (!fs.existsSync(dataDir + "\\configs")) {
            fs.mkdirSync(dataDir + "\\configs", { recursive: true });
        }

        if (!fs.existsSync(dataDir + "\\configs\\nginx\\conf.d")) {
            fs.mkdirSync(dataDir + "\\configs\\nginx\\conf.d", { recursive: true });
        }
    }

    downloadAndUnzipLastRelease() {
        const chat = this;
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
        }).then(async function(url) {
            const file = fs.createWriteStream(downloadPath + "release.zip");

            return axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                headers: {
                    'User-Agent': 'request'
                }
            }).then(async response => {
                return new Promise((resolve, reject) => {
                    response.data.pipe(file);
                    let error = null;
                    file.on('error', err => {
                        error = err;
                        file.close();
                        reject(err);
                    });
                    file.on('close', () => {
                        if (!error) {
                            resolve(true);
                        }
                    });
                });
            }).then(function () {
                return extractZip(downloadPath + "release.zip", { dir: chat.options.dataDir + "\\downloads" });
            });
        });
    }

    copyTemplates(parameters) {
        const downloadsPath = this.options.dataDir + "\\downloads";
        const chat = this;

        const directories =
            fs.readdirSync(downloadsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory() && dirent.name.includes("matrix-control"))
                .map(dirent => dirent.name);

        if (directories.length !== 1) {
            throw "downloads contains more than 1 matrix-control folders";
        }

        const dockerPath = downloadsPath + "\\" + directories[0] + "\\docker\\";
        const destPath = this.options.dataDir;

        return chat.copyTemplate(dockerPath + "docker-compose.yml", destPath + "docker-compose.yml", parameters).then( function () {
            return chat.copyTemplate(dockerPath + "homeserver-template.yaml", destPath + "configs\\homeserver.yaml", parameters);
        });
    }

    removeDownloads() {
        const downloadPath = this.options.dataDir + "downloads\\";

        if (fs.existsSync(downloadPath)) {
            fs.rmdirSync(downloadPath, {recursive: true});
        }
    }

    copyTemplate(source, dest, parameters) {
        return fs.promises.readFile(source,  'utf8')
            .then(function (result) {
                Object.keys(parameters).map(function(objectKey, index) {
                    const value = parameters[objectKey];
                    result = result.replace(new RegExp(objectKey, 'g'), value);
                });

                return fs.writeFile(dest, result, 'utf8', function (err) {
                    if (err) return console.log(err);
                });
            })
    }

    generateMatrixKey() {
        const chat = this;

        return dockerCompose
            .run("bastyon-chat", "generate", {cwd: this.options.dataDir})
            .then(function () {
                const signingKey = chat.options.domain + ".signing.key";
                const logFile = chat.options.domain + ".log.config";

                const dataPath = chat.options.dataDir + "\\data\\";
                const configsPath = chat.options.dataDir + "\\configs\\";

                fs.copyFile(dataPath + signingKey, configsPath + signingKey, function (error) {
                    if (error)
                        console.log(error);
                });
                fs.copyFile(dataPath + logFile, configsPath + logFile, function (error) {
                    if (error)
                        console.log(error);
                });

                fs.rmSync(dataPath + signingKey);
                fs.rmSync(dataPath + logFile);
                fs.rmSync(dataPath + "homeserver.yaml");
            });
    }
}

