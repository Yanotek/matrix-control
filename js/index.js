const ChatControl = require("./chat-control");
const chat = new ChatControl({
    dataDir: "C:\\temp\\matrix-data\\",
    domain: "lolec.ru",
    port: 8008
});

// chat.copyTemplate("C:\\temp\\matrix-data\\homeserver-template.yaml", "C:\\temp\\matrix-data\\homeserver.yaml", {
//     "#DOMAIN": "vamily.ru"
// })

chat.generateSslCert();
    // .then(function () {
    //     console.log("install complete");
    // })
    // .catch(function (reason) {
    //     console.error(reason);
    // });