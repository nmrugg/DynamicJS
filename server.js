/*jslint node: true, nomen: true, white: true, indent: 4 */

"use strict";

/// For help: node server.js --help

var fs    = require("fs"),
    http  = require("http"),
    path  = require("path"),
    spawn = require('child_process').spawn,
    url   = require("url"),
    qs    = require("querystring"),
    
    brk      = false,
    debug    = false,
    debug_port,
    dir      = process.cwd(),
    feedback = false,
    jsext    = false,
    mime,
    php      = false,
    port     = 8888;

/// Get options and settings.
(function ()
{
    var i = 2,
        param_len = process.argv.length;
    
    for (; i < param_len; i += 1) {
        if (process.argv[i].substr(0, 11) === "--debug-brk") {
            if (process.argv[i].length > 11) {
                if (process.argv[i].substr(11, 1) === "=") {
                    debug = true;
                    brk   = true;
                    if (process.argv[i].slice(12) > 0) {
                        debug_port = process.argv[i].slice(12);
                    } else {
                        console.log("Bad debugging port.");
                    }
                } else {
                    console.log("Warning: Unrecognized option '" + process.argv[i] + "'. Did you mean --debug-brk?");
                }
            } else {
                debug = true;
                brk   = true;
            }
        } else if (process.argv[i].substr(0, 7) === "--debug") {
            if (process.argv[i].length > 7) {
                if (process.argv[i].substr(7, 1) === "=") {
                    debug = true;
                    if (process.argv[i].slice(8) > 0) {
                        debug_port = process.argv[i].slice(8);
                    } else {
                        console.log("Bad debugging port.");
                    }
                } else {
                    console.log("Warning: Unrecognized option '" + process.argv[i] + "'. Did you mean --debug?");
                }
            } else {
                debug = true;
            }
        } else if (process.argv[i] === "--debug-brk") {
            debug = true;
            brk   = true;
        } else if (process.argv[i] === "--feedback") {
            feedback = true;
        } else if (process.argv[i] === "--php") {
            php = true;
        } else if (process.argv[i].substr(0, 4) === "--js") {
            if (process.argv[i].length > 4 && process.argv[i].substr(4, 1) === "=") {
                jsext = process.argv[i].slice(5);
                /// Add a leading dot.
                if (jsext !== "" && jsext.substr(0, 1) !== ".") {
                    jsext = "." + jsext;
                }
            } else {
                jsext = ".js";
            }
        } else if (process.argv[i].substr(0, 7) === "--mime=") {
            mime = process.argv[i].slice(7);
        } else if (process.argv[i] === "--help" || process.argv[i] === "-h" || process.argv[i] === "-help") {
            console.log("Usage: node server.js [options] [ROOT_PATH] [PORT]");
            console.log("  Default root is the current working directory");
            console.log("  Default port is 8888");
            console.log("");
            console.log("Examples:");
            console.log("  node server.js");
            console.log("  node server.js 8080");
            console.log("  node server.js --debug");
            console.log("  node server.js --feedback");
            console.log("  node server.js --js=jss");
            console.log("  node server.js --js /var/www/");
            console.log("  node server.js --mime=text/html");
            console.log("  node server.js --php --debug-brk=8000 /var/www/ 8080");
            console.log("");
            console.log("  --debug[=port]     Run in debug mode, and optionally set the debugging port");
            console.log("  --debug-brk[=port] Run in debug mode, start with a break, and optionally set the debugging port");
            console.log("  --feedback         Output node messages to stdout");
            console.log("  --help, -h         This help");
            console.log("  --js[=ext]         Enable JS execution and optionally set the file extension to execute (default: js)");
            console.log("  --mime=val         Set the default mime type");
            console.log("  --php              Enable execution of .php files");
            console.log("");
            console.log("Latest verion can be found at https://github.com/nmrugg/DynamicJS");
            process.exit();
        } else if (Number(process.argv[i]) > 0) {
            port = Number(process.argv[i]);
        } else if (path.existsSync(process.argv[i])) {
            dir = path.resolve(process.argv[i]);
        } else {
            console.log("Warning: Unrecognized option '" + process.argv[i] + "'. See --help for acceptable options. Continuing blissfully.");
        }
    }
}());

process.on("uncaughtException", function(e)
{
    if (e.errno === 98) {
        console.log("Error: Unable to create server because port " + port + " is already is use.");
    } else if (e.errno === 13) {
        console.log("Error: You do not have permission to open port " + port + ".\nTry a port above 1023 or running \"sudo !!\"");
    } else {
        console.log("Error: " + e.message);
    }
    
    process.exit(e.errno);
});

/// Start the server.
http.createServer(function (request, response)
{
    var filename,
        get_data,
        post_data,
        uri,
        url_parsed = url.parse(request.url);
    
    uri = url_parsed.pathname;
    filename = path.join(dir, qs.unescape(uri));
    
    function request_page()
    {
        path.exists(filename, function (exists)
        {
            /// If the URI does not exist, display a 404 error.
            if (!exists) {
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not Found\n");
                response.end();
                return;
            }
            
            /// If the URI is a directory, try to load index pages.
            if (fs.statSync(filename).isDirectory()) {
                /// If the URL does not end in a slash, we need to add it and tell the browser to try again.
                if (uri.slice(-1) !== "/") {
                    response.writeHead(301, {"Location":uri + "/" + (url_parsed.search || "")});
                    response.end();
                    return;
                } else {
                    if (jsext !== false && path.existsSync(filename + "/index" + jsext)) {
                        filename += "/index" + jsext;
                    } else if (php && path.existsSync(filename + "/index.php")) {
                        filename += "/index.php";
                    } else if (path.existsSync(filename + "/index.html")) {
                        filename += "/index.html";
                    } else {
                        filename += "/index.htm";
                    }
                }
            }
            /// The dynamic part:
            /// If the file is a JavaScript file, execute it and write the results.
            if ((jsext !== false && path.extname(filename) === jsext) || (php && path.extname(filename) === ".php")) {
            
                ///NOTE: Executing a command is not secure, but right now, node always caches files that are require'd().
                (function ()
                {
                    var cmd,
                        debug_cmd,
                        has_written_head = false;
                    
                    if (php && path.extname(filename) === ".php") {
                        /// Send any GET or POST data to the PHP file by executing some code first and then include()'ing the file.
                        cmd = spawn("php", ["-r", "$TMPVAR = json_decode($argv[1], true); $_GET = (isset($TMPVAR[\"GET\"]) ? $TMPVAR[\"GET\"] : array()); $_POST = (isset($TMPVAR[\"POST\"]) ? $TMPVAR[\"POST\"] : array()); $_REQUEST = array_merge($_GET, $_POST); unset($TMPVAR); chdir('" + path.dirname(filename).replace(/[\\']/g, "\\$&") + "'); include('" + filename.replace(/[\\']/g, "\\$&") + "');", JSON.stringify({GET: get_data, POST: post_data})]);
                    } else if (jsext !== false) {
                        if (debug) {
                            /// Start node in debugging mode.
                            ///NOTE: In some (or all) versions of node.js (0.5.4-), --debug-brk will not work with symlinks; therefor, we must find the real path via realpathSync().
                            cmd = spawn("node", ["--debug" + (brk ? "-brk" : ""), fs.realpathSync(filename), JSON.stringify([get_data, post_data])]);
                            
                            /// Start the debugger script.
                            debug_cmd = spawn("node", [__dirname + "/node-inspector/bin/inspector.js", "--web-port=" + (debug_port ? debug_port : (port === 8888 ? "8000" : "8888"))]);
                            
                            debug_cmd.stdout.on("data", function (data)
                            {
                                if (feedback) {
                                    console.log(data.toString());
                                }
                            });
                            
                            debug_cmd.stderr.on("data", function (data)
                            {
                                if (feedback) {
                                    console.log(data.toString());
                                }
                            });
                            
                            debug_cmd.on("exit", function (code) {});
                        } else {
                            cmd = spawn("node", [filename, JSON.stringify({GET: get_data, POST: post_data})]);
                        }
                    }
                    
                    cmd.stdout.on("data", function (data)
                    {
                        if (!has_written_head) {
                            response.writeHead(200, (typeof mime !== "undefined" ? {"Content-Type": mime} : {"Content-Type": "text/html"}));
                            has_written_head = true;
                        }
                        response.write(data);
                    });
                    
                    cmd.stderr.on("data", function (data)
                    {
                        /// Display any errors in the console.
                        if (feedback) {
                            console.log(data.toString());
                        }
                    });
                    
                    cmd.on("exit", function (code)
                    {
                        response.end();
                    });
                }());
            } else {
                /// Write the static file.
                fs.readFile(filename, "binary", function (err, file)
                {
                    /// If the file cannot be loaded, display a 500 error.
                    if (err) {
                        response.writeHead(500, {"Content-Type": "text/plain"});
                        response.write(err + "\n");
                        response.end();
                        return;
                    }
                    
                    /// If the file loads correctly, write it to the client.
                    response.writeHead(200);
                    response.write(file, "binary");
                    response.end();
                });
            }
        });
    }
    
    
    /// Is there GET data?
    if (url_parsed.query !== "") {
        ///NOTE: GET data can be retrieved in node.js scripts via the following code:
        ///      get_data = JSON.parse(process.argv[2]).GET;
        get_data = qs.parse(url_parsed.query);
    }
    
    /// Is there POST data?
    if (request.method === "POST") {
    
        post_data = "";
        
        request.on("data", function(chunk)
        {
            /// Get the POST data.
            post_data += chunk.toString();
        });
        
        request.on("end", function(chunk)
        {
            ///NOTE: POST data can be retrieved in node.js scripts via the following code:
            ///      post_data = JSON.parse(process.argv[2]).POST;
            post_data = qs.parse(post_data);
            request_page();
        });
    } else {
        request_page();
    }
    
}).listen(port);
