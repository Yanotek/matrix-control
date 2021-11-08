const dockerCLI = require('docker-cli-js');
const dockerCompose = require('docker-compose');
const tcpPortUsed = require('tcp-port-used');

module.exports.checkDocker = function() {
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

module.exports.checkPortIsBusy = function(port) {
    tcpPortUsed.check(port, '127.0.0.1')
        .then(function(inUse) {
            if (inUse) {
                console.error('Port ' + port + ' in usage');
            }

            return inUse;
        }, function(err) {
            console.error('Error on check: ', err.message);

            return false;
        });
}

module.exports.checkMatrixCert = function() {
    console.log(name + " zalupa");
}

module.exports.checkHomeServerConfig = function() {
    console.log(name + " zalupa");
}

module.exports.checkSslCert = function() {
    console.log(name + " zalupa");
}

module.exports.checkWhatFolderIsEmpty = function() {
    console.log(name + " zalupa");
}