const ChatControl = require("./chat-control");
const chat = new ChatControl({
    dataDir: "C:\\temp\\matrix-data\\",
    domain: "localhost",
    port: 5007
});

// chat.copyTemplate("C:\\temp\\matrix-data\\homeserver-template.yaml", "C:\\temp\\matrix-data\\homeserver.yaml", {
//     "#DOMAIN": "vamily.ru"
// })

chat.installLastRelease()
    .then(function () {
        console.log("install complete");
    })
    .catch(function (reason) {
        console.error(reason);
    });