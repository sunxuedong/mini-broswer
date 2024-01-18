const http = require("http");
const fs = require("fs");
const path = require("path");

http.createServer((request, response) => {
    let body = [];
    request
        .on("error", (err) => {
            console.error(err);
        })
        .on("data", (chunk) => {
            body.push(chunk.toString());
        })
        .on("end", () => {
            // body = Buffer.concat(body).toString();
            console.log("body:", body);
            response.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
            fs.readFile(path.join(__dirname, "/index.html"), "utf8", function (err, data) {
                if (err) {
                    throw err;
                }
                console.log(data.length)
                response.end(data);
            });
        });
}).listen(8088);

console.log("server started");
