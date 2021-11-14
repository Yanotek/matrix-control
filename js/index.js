const ChatControl = require("./chat-control");
const chat = new ChatControl({
    dataDir: "C:\\temp\\matrix-data\\",
    domain: "188.187.45.218",
    port: 33456
});

chat.checkExistsNewReleaseByTag()
    .then(function (exists) {
        console.log("New release " + exists);
    })
    .catch(function (reason) {
        console.error(reason);
    });