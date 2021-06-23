const got = require("got");
const cheerio = require("cheerio");
const http = require("http");
const fs = require("fs");
const { parse } = require("url");
const ac = require("@antiadmin/anticaptchaofficial");
const port = process.env.PORT || 32333;
if (process.env.ACKEY && !fs.existsSync(__dirname + "/config.json")) {
    if (process.env.NOARCHIVE == "true") {
        fs.writeFileSync(__dirname + "/config.json", JSON.stringify({
            "key": process.env.ACKEY,
            "antiCaptcha": true,
            "archiveLinks": false 
        }));
    } else {
        fs.writeFileSync(__dirname + "/config.json", JSON.stringify({
            "key": process.env.ACKEY,
            "antiCaptcha": true,
            "archiveLinks": true
        }));
    }
} else if (process.env.NOARCHIVE == "true" && !fs.existsSync(__dirname + "/config.json")) {
    fs.writeFileSync(__dirname + "/config.json", JSON.stringify({
        "key": "",
        "antiCaptcha": false,
        "archiveLinks": false
    }));
} else if (!fs.existsSync(__dirname + "/config.json")){
    fs.copyFileSync(__dirname + "/config.example.json", __dirname + "/config.json");
}

const config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

http.createServer(requestListner).listen(port);
console.log("[i] listening on port " + port);

function requestListner(request, response) {
    var url = parse(request.url, true);
    if (url.pathname.startsWith("/api")) {
        var p = url.pathname.split("/").slice(2);
        switch (p[0]) {
            case "bypass":
                if (url.query.url) {
                    var u = Buffer.from(url.query.url, "base64").toString("ascii");
                    var requestedUrl = parse(u, true);

                    if (requestedUrl.protocol == "https:" && requestedUrl.hostname == "ow.ly") {
                        var u = "http" + u.substring(5);
                        var requestedUrl = parse(u, true);
                    }

                    if (config.archiveLinks == true && !fs.existsSync(__dirname + "/archive.json")) {
                        fs.writeFileSync(__dirname + "/archive.json", JSON.stringify([]));
                    } else if (fs.existsSync(__dirname + "/archive.json") && !url.query.ignoreArchive || url.query.ignoreArchive !== "true") {
                        var j = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                        for (var c in j) {
                            if (j[c].original == requestedUrl.href) {
                                var j = JSON.stringify({
                                    success: true,
                                    fromArchive: true,
                                    url: j[c].dest
                                });
                                response.writeHead(200, {
                                    "Content-Type": "application/json",
                                    "Access-Control-Allow-Origin": "*"
                                });
                                response.end(j);
                                return;
                            } else {
                                continue;
                            }
                        }
                    } else if (fs.existsSync(__dirname + "/archive.json")) {
                        var j = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                        var nj = [];
                        for (var c in j) {
                            if (j[c].original == requestedUrl.href) {
                                continue;
                            } else {
                                nj.push(j[c]);
                            }
                        }
                    }

                    switch(requestedUrl.hostname) {
                        case "adshrink.it":
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                for (var c in $("script")) {
                                    if (
                                        $("script")[c] == undefined || 
                                        $("script")[c].children == undefined || 
                                        $("script")[c].children[0] == undefined || 
                                        $("script")[c].children[0].data == undefined
                                    ) {continue;} else {
                                        if ($("script")[c].children[0].data.includes("_sharedData")) {
                                            var json = $("script")[c].children[0].data.split("_sharedData = ")[1].split("};")[0]
                                            json = JSON.parse(json + "}");
                                            json = JSON.parse(json[0].metadata);
                                            json = json.url;
                                            response.writeHead(200, {
                                                "Content-Type": "application/json",
                                                "Access-Control-Allow-Origin": "*"
                                            });
                                            if (config.archiveLinks == true) {
                                                var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                                a.push({
                                                    "original": requestedUrl.href,
                                                    "dest": json.url
                                                });
                                                fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                            }
                                            var j = JSON.stringify({
                                                "success": true,
                                                "fromArchive": false,
                                                "url": json
                                            });
                                            response.end(j);
                                        } else {
                                            continue;
                                        }  
                                    } 
                                }
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "linkvertise.com":
                        case "linkvertise.net":
                        case "up-to-down.net":
                        case "link-to.net":
                        case "direct-link.net":
                            var uu = "https://publisher.linkvertise.com/api/v1/redirect/link/static" + requestedUrl.pathname;
                            got(uu, { 
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1",
                                    "Sec-GPC": "1",
                                    "Cache-Control": "max-age=0",
                                    "TE": "Trailers"
                                }
                            }).then(function(resp) {
                                var j = JSON.parse(resp.body);
                                var id = j.data.link.id;
                                var serial = JSON.stringify({
                                    timestamp: new Date() * 1,
                                    random: "6548307",
                                    link_id: id
                                });
                                serial = Buffer.from(serial).toString("base64");
                                var uu2 = "https://publisher.linkvertise.com/api/v1/redirect/link" + requestedUrl.pathname + "/target?serial=" + serial;
                                got.post(uu2, {
                                    headers: {
                                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                        "Accept-Language": "en-US,en;q=0.5",
                                        "Accept-Encoding": "gzip, deflate, br",
                                        "DNT": "1",
                                        "Connection": "keep-alive",
                                        "Upgrade-Insecure-Requests": "1",
                                        "Sec-GPC": "1",
                                        "Cache-Control": "max-age=0",
                                        "TE": "Trailers"
                                    }
                                }).then(function(resp) {
                                    var json = JSON.parse(resp.body);
                                    response.writeHead(200, {
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*"
                                    });
                                    if (config.archiveLinks == true) {
                                        var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                        a.push({
                                            "original": requestedUrl.href,
                                            "dest": json.data.target
                                        });
                                        fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                    }
                                    var j = JSON.stringify({
                                        "success": true,
                                        "fromArchive": false,
                                        "url": json.data.target
                                    });
                                    response.end(j);
                                }).catch(function(error) {
                                    response.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    var j = JSON.stringify({
                                        "success": false,
                                        "err": {
                                            "code": error.code,
                                            "stack": error.stack,
                                            "message": error.message
                                        }
                                    });
                                    response.end(j);
                                });
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "t.co":
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                var r = $("script")[0].children[0].data;
                                r = r.split('replace("')[1];
                                r = r.split('"').slice(0, (r.split('"').length - 1)).join('"');
                                r = r.split("\\").join("");
                                var j = JSON.stringify({
                                    "success": true,
                                    "fromArchive": false,
                                    "url": r
                                });
                                if (config.archiveLinks == true) {
                                    var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                    a.push({
                                        "original": requestedUrl.href,
                                        "dest": r
                                    });
                                    fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                }
                                response.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                response.end(j);
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "www.shortly.xyz":
                        case "shortly.xyz":
                            got(u, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                var i = $("form input").attr("value");
                                i = "id=" + i;
                                got.post("https://shortly.xyz/getlink.php", {
                                    body: i,
                                    headers: {
                                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                        "Accept": "*/*",
                                        "Accept-Language": "en-US,en;q=0.5",
                                        "Accept-Encoding": "gzip, deflate, br",
                                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                        "X-Requested-With": "XMLHttpRequest",
                                        "Content-Length": totalBytes(i),
                                        "Origin": "https://www.shortly.xyz",
                                        "Connection": "keep-alive",
                                        "Referer": "https://www.shortly.xyz",
                                        "DNT": "1"
                                    }
                                }).then(function(resp) {
                                    if (config.archiveLinks == true) {
                                        var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                        a.push({
                                            "original": requestedUrl.href,
                                            "dest": resp.body
                                        });
                                        fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                    }
                                    var j = JSON.stringify({
                                        "success": true,
                                        "fromArchive": false,
                                        "url": resp.body
                                    });
                                    response.writeHead(200, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    response.end(j);
                                }).catch(function(error) {
                                    response.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    var j = JSON.stringify({
                                        "success": false,
                                        "err": {
                                            "code": error.code,
                                            "stack": error.stack,
                                            "message": error.message
                                        }
                                    });
                                    response.end(j);
                                })
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "sub2unlock.com":
                        case "www.sub2unlock.com":
                        case "sub2unlock.net":
                        case "www.sub2unlock.net":
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                var j = JSON.stringify({
                                    "success": true,
                                    "fromArchive": false,
                                    "url": $("#theGetLink").text()
                                });
                                if (config.archiveLinks == true) {
                                    var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                    a.push({
                                        "original": requestedUrl.href,
                                        "dest": $("#theGetLink").text()
                                    });
                                    fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                }
                                response.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                response.end(j);
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "www.shortconnect.com":
                        case "shortconnect.com":
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                var j = JSON.stringify({
                                    "success": true,
                                    "fromArchive": false,
                                    "url": $("#loader-link")[0].attribs.href
                                });
                                if (config.archiveLinks == true) {
                                    var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                    a.push({
                                        "original": requestedUrl.href,
                                        "dest": $("#loader-link")[0].attribs.href
                                    });
                                    fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                }
                                response.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                response.end(j);
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "boost.ink":
                        case "bst.wtf":
                        case "booo.st":
                        case "bst.gg":
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                for (var c in $("script")) {
                                    if (
                                        $("script")[c] !== undefined &&
                                        $("script")[c].attribs !== undefined &&
                                        $("script")[c].attribs.version !== undefined
                                    ) {
                                        var r = Buffer.from($("script")[c].attribs.version, "base64");
                                        r = r.toString("ascii");
                                        var j = JSON.stringify({
                                            "success": true,
                                            "fromArchive": false,
                                            "url": r
                                        });
                                        if (config.archiveLinks == true) {
                                            var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                            a.push({
                                                "original": requestedUrl.href,
                                                "dest": r
                                            });
                                            fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                        }
                                        response.writeHead(200, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        response.end(j);
                                    } else {
                                        continue;
                                    }
                                }
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "href.li":
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                var r = $("a").attr("href");
                                var j = JSON.stringify({
                                    "success": true,
                                    "fromArchive": false,
                                    "url": r
                                });
                                if (config.archiveLinks == true) {
                                    var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                    a.push({
                                        "original": requestedUrl.href,
                                        "dest": r
                                    });
                                    fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                }
                                response.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                response.end(j);
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "adfoc.us":
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                var j = JSON.stringify({
                                    "success": true,
                                    "fromArchive": false,
                                    "url": $("#showSkip .skip")[0].attribs.href
                                });
                                if (config.archiveLinks == true) {
                                    var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                    a.push({
                                        "original": requestedUrl.href,
                                        "dest": $("#showSkip .skip")[0].attribs.href
                                    });
                                    fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                }
                                response.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                response.end(j);
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "ouo.io":
                        case "ouo.press":
                            if (config.antiCaptcha == true) {
                                got(requestedUrl.href, {
                                    headers: {
                                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                        "Accept-Language": "en-US,en;q=0.5",
                                        "Accept-Encoding": "gzip, deflate, br",
                                        "DNT": "1",
                                        "Connection": "keep-alive",
                                        "Upgrade-Insecure-Requests": "1"
                                    }   
                                }).then(function(resp) {
                                    var $ = cheerio.load(resp.body);
                                    var coo = "";
                                    for (var c in resp.headers["set-cookie"]) {
                                        var coo = coo + resp.headers["set-cookie"][c].split("; ")[0] + "; ";
                                    }
                                    for (var c in $("head script")) {
                                        if ($("head script")[c].attribs && $("head script")[c].attribs.src && $("head script")[c].attribs.src.includes("?render")) {
                                            var sk = parse($("head script")[c].attribs.src, true).query.render;
                                        } else {
                                            continue;
                                        }
                                    }
                                    ac.setAPIKey(config.key);
                                    ac.shutUp();
                                    ac.solveRecaptchaV2Proxyless(requestedUrl.href, sk).then(function(resp) {
                                        var b = "_token=" + $("#form-captcha [name=_token]").val() + "&x-token=" + resp + "&v-token=" + $("#v-token").val();
                                        var nu = "https://" + requestedUrl.hostname + "/go" + requestedUrl.pathname;
                                        got.post(nu, {
                                            followRedirect: false,
                                            body: b,
                                            headers: {
                                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                                "Accept-Language": "en-US,en;q=0.5",
                                                "Accept-Encoding": "gzip, deflate, br",
                                                "Referer": requestedUrl.href,
                                                "Content-Type": "application/x-www-form-urlencoded",
                                                "Content-Length": totalBytes(b),
                                                "Origin": "https://" + requestedUrl.hostname,
                                                "DNT": "1",
                                                "Connection": "keep-alive",
                                                "Cookie": coo,
                                                "Upgrade-Insecure-Requests": "1",
                                                "Sec-Fetch-Dest": "document",
                                                "Sec-Fetch-Mode": "navigate",
                                                "Sec-Fetch-Site": "same-origin",
                                                "Sec-GPC": "1",
                                                "TE": "Trailers"
                                            }   
                                        }).then(function(resp) {
                                            if (resp.headers.location) {
                                                response.writeHead(200, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type": "application/json"
                                                });
                                                var j = JSON.stringify({
                                                    "success": true,
                                                    "fromArchive": false,
                                                    "url": resp.headers.location
                                                });
                                                if (config.archiveLinks == true) {
                                                    var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                                    a.push({
                                                        "original": requestedUrl.href,
                                                        "dest": resp.headers.location
                                                    });
                                                    fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                                }
                                                response.end(j);
                                                return;
                                            }
                                            var $ = cheerio.load(resp.body);
                                            var b2 = "_token=" + $("#form-go [name=_token]").val() + "&x-token=" + $("#x-token").val();
                                            got.post($("#form-go").attr("action"), {
                                                body: b2,
                                                followRedirect: false,
                                                headers: {
                                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                                    "Accept-Language": "en-US,en;q=0.5",
                                                    "Accept-Encoding": "gzip, deflate, br",
                                                    "Referer": nu,
                                                    "Content-Type": "application/x-www-form-urlencoded",
                                                    "Content-Length": totalBytes(b2),
                                                    "Origin": "https://" + requestedUrl.hostname,
                                                    "DNT": "1",
                                                    "Connection": "keep-alive",
                                                    "Cookie": coo,
                                                    "Upgrade-Insecure-Requests": "1",
                                                    "Sec-Fetch-Dest": "document",
                                                    "Sec-Fetch-Mode": "navigate",
                                                    "Sec-Fetch-Site": "same-origin",
                                                    "Sec-GPC": "1",
                                                    "TE": "Trailers"
                                                }
                                            }).then(function(resp) {
                                                if (resp.headers.location) {
                                                    response.writeHead(200, {
                                                        "Access-Control-Allow-Origin": "*",
                                                        "Content-Type": "application/json"
                                                    });
                                                    var j = JSON.stringify({
                                                        "success": true,
                                                        "fromArchive": false,
                                                        "url": resp.headers.location
                                                    });
                                                    if (config.archiveLinks == true) {
                                                        var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                                        a.push({
                                                            "original": requestedUrl.href,
                                                            "dest": resp.headers.location
                                                        });
                                                        fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                                    }
                                                    response.end(j);
                                                    return;
                                                } else {
                                                    response.writeHead(500, {
                                                        "Access-Control-Allow-Origin": "*",
                                                        "Content-Type": "application/json"
                                                    });
                                                    var j = JSON.stringify({
                                                        "success": false,
                                                        "err": {
                                                            "code": "noneFound",
                                                            "message": "No redirects were found."
                                                        }
                                                    });
                                                    response.end(j);
                                                }
                                            }).catch(function(error) {
                                                response.writeHead(500, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type": "application/json"
                                                });
                                                var j = JSON.stringify({
                                                    "success": false,
                                                    "err": {
                                                        "code": error.code,
                                                        "stack": error.stack,
                                                        "message": error.message
                                                    }
                                                });
                                                response.end(j);
                                            });
                                        }).catch(function(error) {
                                            response.writeHead(500, {
                                                "Access-Control-Allow-Origin": "*",
                                                "Content-Type": "application/json"
                                            });
                                            var j = JSON.stringify({
                                                "success": false,
                                                "err": {
                                                    "code": error.code,
                                                    "stack": error.stack,
                                                    "message": error.message
                                                }
                                            });
                                            response.end(j);
                                        });
                                    }).catch(function(error) {
                                        response.writeHead(500, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        var j = JSON.stringify({
                                            "success": false,
                                            "err": {
                                                "message": error
                                            }
                                        });
                                        response.end(j);
                                    });
                                }).catch(function(error) {
                                    response.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    var j = JSON.stringify({
                                        "success": false,
                                        "err": {
                                            "code": error.code,
                                            "stack": error.stack,
                                            "message": error.message
                                        }
                                    });
                                    response.end(j);
                                });
                            } else {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": "noACKey",
                                        "message": "No Anti-Captcha key was provided by the instance owner."
                                    }
                                });
                                response.end(j);
                            }
                        return;

                        case "won.pe":
                            if (config.antiCaptcha == true) {
                                got(requestedUrl.href, {
                                    headers: {
                                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                        "Accept-Language": "en-US,en;q=0.5",
                                        "Accept-Encoding": "gzip, deflate, br",
                                        "DNT": "1",
                                        "Connection": "keep-alive",
                                        "Upgrade-Insecure-Requests": "1",
                                        "Sec-Fetch-Dest": "document",
                                        "Sec-Fetch-Mode": "navigate",
                                        "Sec-Fetch-Site": "none",
                                        "Sec-GPC": "1",
                                        "TE": "Trailers"
                                    }
                                }).then(function(resp) {
                                    var $ = cheerio.load(resp.body);
                                    var lid = $("#lid").val();
                                    var token = $("#token").val();
                                    var vid = $("#vid").val();
                                    var ads = "1";
                                    var adb = "false";
                                    for (var c in $("body script")) {
                                        if ($("body script")[c].attribs && $("body script")[c].attribs.src && $("body script")[c].attribs.src.includes("?render")) {
                                            var sk = parse($("body script")[c].attribs.src, true).query.render;
                                        } else {
                                            continue;
                                        }
                                    }
                                    ac.setAPIKey(config.key);
                                    ac.shutUp();
                                    ac.solveRecaptchaV2Proxyless(requestedUrl.href, sk).then(function(resp) {
                                        var p = "response=" + resp + "&ads=" + ads + "&lid=" + lid + "&vid=" + vid + "&token=" + token + "&adblock=" + adb + "&referer=&push=";
                                        got.post("https://won.pe/ajax/click", {
                                            body: p,
                                            headers: {
                                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                                "Accept-Language": "en-US,en;q=0.5",
                                                "Accept-Encoding": "gzip, deflate, br",
                                                "Referer": requestedUrl.href,
                                                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                                "X-Requested-With": "XMLHttpRequest",
                                                "Content-Length": totalBytes(p),
                                                "DNT": "1",
                                                "Connection": "keep-alive",
                                                "Upgrade-Insecure-Requests": "1",
                                                "Sec-Fetch-Dest": "document",
                                                "Sec-Fetch-Mode": "navigate",
                                                "Sec-Fetch-Site": "none",
                                                "Sec-GPC": "1",
                                                "TE": "Trailers"
                                            }
                                        }).then(function(resp) {
                                            var rj = JSON.parse(resp.body);
                                            if (rj.url) {
                                                var j = JSON.stringify({
                                                    "success": true,
                                                    "fromArchive": false,
                                                    "url": rj.url
                                                });
                                                response.writeHead(200, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type": "application/json"
                                                });
                                                if (config.archiveLinks == true) {
                                                    var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                                    a.push({
                                                        "original": requestedUrl.href,
                                                        "dest": rj.url
                                                    });
                                                    fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                                }
                                                response.end(j);
                                            } else {
                                                response.writeHead(500, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type": "application/json"
                                                });
                                                var j = JSON.stringify({
                                                    "success": false,
                                                    "err": {
                                                        "code": "noneFound",
                                                        "message": "No redirects were found."
                                                    }
                                                });
                                                response.end(j);
                                            }
                                        }).catch(function(error) {
                                            response.writeHead(500, {
                                                "Access-Control-Allow-Origin": "*",
                                                "Content-Type": "application/json"
                                            });
                                            var j = JSON.stringify({
                                                "success": false,
                                                "err": {
                                                    "code": error.code,
                                                    "stack": error.stack,
                                                    "message": error.message
                                                }
                                            });
                                            response.end(j);
                                        });
                                    }).catch(function(error) {
                                        response.writeHead(500, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        var j = JSON.stringify({
                                            "success": false,
                                            "err": {
                                                "message": error
                                            }
                                        });
                                        response.end(j);
                                    });
                                }).catch(function(error) {
                                    response.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    var j = JSON.stringify({
                                        "success": false,
                                        "err": {
                                            "code": error.code,
                                            "stack": error.stack,
                                            "message": error.message
                                        }
                                    });
                                    response.end(j);
                                });
                            } else {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": "noACKey",
                                        "message": "No Anti-Captcha key was provided by the instance owner."                                       
                                    }
                                });
                                response.end(j);
                            }
                        return;

                        case "ity.im":
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                var $ = cheerio.load(resp.body);
                                var j = JSON.stringify({
                                    "success": true,
                                    "fromArchive": false,
                                    "url": $(".col-md-4:not(#logo_div) a")[0].attribs.href
                                });
                                if (config.archiveLinks == true) {
                                    var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                    a.push({
                                        "original": requestedUrl.href,
                                        "dest": $(".col-md-4:not(#logo_div) a")[0].attribs.href
                                    });
                                    fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                }
                                response.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                response.end(j);
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;

                        case "tii.ai":
                        case "tei.ai":
                            if (config.antiCaptcha) {
                                got(requestedUrl.href, {
                                    headers: {
                                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
                                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                        "Accept-Language": "en-US",
                                        "Accept-Encoding": "gzip, deflate, br",
                                        "DNT": "1",
                                        "Connection": "keep-alive",
                                        "Upgrade-Insecure-Requests": "1",
                                        "Sec-Fetch-Dest": "document",
                                        "Sec-Fetch-Mode": "navigate",
                                        "Sec-Fetch-Site": "none",
                                        "Sec-Fetch-User": "?1",
                                        "Sec-GPC": "1",
                                        "Cache-Control": "max-age=0",
                                        "TE": "trailers"
                                    }
                                }).then(function(resp) {
                                    var $ = cheerio.load(resp.body);
                                    var tk = $("#link-view form [name='token']").val();
                                    tk = tk.split("aHR").slice(1).join("aHR");
                                    tk = "aHR" + tk;
                                    tk = Buffer.from(tk, "base64").toString("utf-8");
                                    var j = JSON.stringify({
                                        "success": true,
                                        "fromArchive": false,
                                        "url": tk
                                    });
                                    if (config.archiveLinks == true) {
                                        var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                        a.push({
                                            "original": requestedUrl.href,
                                            "dest": tk
                                        });
                                        fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                    }
                                    response.writeHead(200, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    response.end(j);
                                }).catch(function(error) {
                                    response.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    var j = JSON.stringify({
                                        "success": false,
                                        "err": {
                                            "code": error.code,
                                            "stack": error.stack,
                                            "message": error.message
                                        }
                                    });
                                    response.end(j);
                                });
                            } else {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": "noACKey",
                                        "message": "No Anti-Captcha key was provided by the instance owner."
                                    }
                                });
                                response.end(j);
                            }
                        return;
                            

                        default:
                            got(requestedUrl.href, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
                                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "DNT": "1",
                                    "Connection": "keep-alive",
                                    "Upgrade-Insecure-Requests": "1"
                                }
                            }).then(function(resp) {
                                if (resp.body.split("ysmm = ").length > 1) {
                                    // adfly detection
                                    let a, m, I = "",
                                        X = "",
                                        r = resp.body.split(`var ysmm = `)[1].split('\'')[1];
                                    for (m = 0; m < r.length; m++) {
                                        if (m % 2 == 0) {
                                            I += r.charAt(m);
                                        } else {
                                            X = r.charAt(m) + X;
                                        }
                                    }
                                    r = I + X;
                                    a = r.split("");
                                    for (m = 0; m < a.length; m++) {
                                        if (!isNaN(a[m])) {
                                            for (var R = m + 1; R < a.length; R++) {
                                                if (!isNaN(a[R])) {
                                                    let S = a[m] ^ a[R]
                                                    if (S < 10) {
                                                        a[m] = S
                                                    }
                                                    m = R
                                                    R = a.length
                                                }
                                            }
                                        }
                                    }
                                    r = a.join("")
                                    r = Buffer.from(r, "base64").toString("ascii");
                                    r = r.substring(r.length - (r.length - 16));
                                    r = r.substring(0, r.length - 16);
                                    if (new URL(r).search.includes("dest=")) {
                                        r = decodeURIComponent(r.split("dest=")[1]);
                                    }
                                    response.writeHead(200, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    if (config.archiveLinks == true) {
                                        var ar = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                        ar.push({
                                            "original": requestedUrl.href,
                                            "dest": r
                                        });
                                        fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(ar));
                                    }
                                    var j = JSON.stringify({
                                        "success": true,
                                        "url": r
                                    });
                                    response.end(j);
                                } else if (resp.url == u) {
                                    if (resp.redirects !== undefined && resp.redirects.length > 0) {
                                        var r = resp.redirects[resp.redirects.length - 1];
                                        if (config.archiveLinks == true) {
                                            var a = JSON.parse(fs.readFileSync(__dirname + "/archive.json"));
                                            a.push({
                                                "original": requestedUrl.href,
                                                "dest": r
                                            });
                                            fs.writeFileSync(__dirname + "/archive.json", JSON.stringify(a));
                                        }
                                        response.writeHead(200, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        var j = JSON.stringify({
                                            "success": true,
                                            "url": r
                                        });
                                        response.end(j);
                                    } else {
                                        response.writeHead(500, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        var j = JSON.stringify({
                                            "success": false,
                                            "err": {
                                                "code": "noneFound",
                                                "message": "No redirects were found."
                                            }
                                        });
                                        response.end(j);
                                    }
                                } else {
                                    if (parse(resp.url, true).hostname == "preview.tinyurl.com") {
                                        var $ = cheerio.load(resp.body);
                                        var r = $("#redirecturl").attr("href");
                                        response.writeHead(200, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        var j = JSON.stringify({
                                            "success": true,
                                            "url": r
                                        });
                                        response.end(j);
                                    } else {
                                        response.writeHead(200, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        var j = JSON.stringify({
                                            "success": true,
                                            "url": resp.url
                                        });
                                        response.end(j);
                                    }
                                }
                            }).catch(function(error) {
                                response.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": error.code,
                                        "stack": error.stack,
                                        "message": error.message
                                    }
                                });
                                response.end(j);
                            });
                        return;
                    }
                } else {
                    response.writeHead(400, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    });
                    response.end(JSON.stringify({
                        "success": false,
                        "err": {
                            "code": "needUrl",
                            "message": "This endpoint requires a URL."
                        }
                    }));
                }
            return;

            default: 
                response.writeHead(400, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify({
                    "success": false,
                    "err": {
                        "code": "invalidEndpoint",
                        "message": "An invalid endpoint was requested."
                    }
                }))
            return;
        }
    } else {
        if (fs.existsSync(__dirname + "/frontend" + url.pathname + "index.html")) {
            fs.readFile(__dirname + "/frontend" + url.pathname + "index.html", function(err, resp) {
                if (err) {
                    response.writeHead(500, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/plain"
                    });
                    response.end(err.message);
                } else {
                    response.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html"
                    });
                    response.end(resp);
                }
            })
        } else if (fs.existsSync(__dirname + "/frontend" + url.pathname)) {
            fs.readFile(__dirname + "/frontend" + url.pathname, function(err, resp) {
                if (err) {
                    response.writeHead(500, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/plain"
                    });
                    response.end(err.message);
                } else {
                    response.writeHead(200, {
                        "Access-Control-Allow-Origin": "*"
                    });
                    response.end(resp);
                }
            });
        } else {
            response.writeHead(404, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/plain"
            });
            response.end("404 - file not found");
        }
    }
}

function totalBytes(string) {
    return encodeURI(string).split(/%..|./).length - 1;
}

function combineCook(oc, nc) {
    var re = [];
    var ncs = "";
    for (var c in nc.split("; ")) {
        re.push(nc.split("; ")[c].split("=")[0]);
    }
    for (var c in oc.split("; ")) {
        if (inRp(oc.split("; ")[c].split("=")[0], re)) {
            ncs = ncs + oc.split("; ")[c].split("=")[0] + "=" + nc.split("; ")[c].split("=").slice(1).join() + "; ";
        } else {
            ncs = ncs + oc.split("; ")[c].split("=")[0] + "=" + oc.split("; ")[c].split("=").slice(1).join() + "; ";
        }
    }

    if (ncs.includes(" =;")) { ncs.replace(" =;", "")}

    return ncs;
}

function inRp(n, r) {
    for (var c in r) {
        if (r[c] == n) {return true;} else {continue;}
    }
    return false;
}