const ChatControl = require("./chat-control");
const chat = new ChatControl({
    dataDir: "C:\\temp\\matrix-data\\",
    domain: "lolec.ru"
});

chat.downloadAndUnzipLastRelease().then(function() {

});