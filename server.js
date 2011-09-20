/*jslint node: true, nomen: true, white: true, indent: 4 */

"use strict";

/// For help: node server.js --help

var fs    = require("fs"),
    http  = require("http"),
    path  = require("path"),
    proc  = require('child_process'),
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
    php_cmd,
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
                        console.warn("Bad debugging port.");
                    }
                } else {
                    console.warn("Warning: Unrecognized option '" + process.argv[i] + "'. Did you mean --debug-brk?");
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
                        console.warn("Bad debugging port.");
                    }
                } else {
                    console.warn("Warning: Unrecognized option '" + process.argv[i] + "'. Did you mean --debug?");
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
            php_cmd = "php";
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
            console.warn("Warning: Unrecognized option '" + process.argv[i] + "'. See --help for acceptable options. Continuing blissfully.");
        }
    }
}());

/// php-cgi cannot use the -r option
if (php) {
    proc.exec("which php-cgi", function (err, stdout, stderr) {
        if (stdout !== "") {
            php_cmd = "php-cgi";
        }
    });
}

process.on("uncaughtException", function(e)
{
    if (e.errno === 98) {
        console.error("Error: Unable to create server because port " + port + " is already is use.");
    } else if (e.errno === 13) {
        console.error("Error: You do not have permission to open port " + port + ".\nTry a port above 1023 or running \"sudo !!\"");
    } else {
        console.error("Error: " + e.message);
    }
    
    process.exit(1);
});

/// Start the server.
http.createServer(function (request, response)
{
    var filename,
        get_data,
        post_data,
        cookies,
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
                    response.writeHead(301, {"Location":uri + "/" + url_parsed.search});
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
                        response_value = 200,
                        waiting_for_headers = true;
                    
                    if (php && path.extname(filename) === ".php") {
                        /// Send any GET or POST data to the PHP file by executing some code first and then include()'ing the file.
                        //cmd = proc.spawn(php_cmd, ["-r", "$TMPVAR = json_decode($argv[1], true); $_GET = (isset($TMPVAR[\"GET\"]) ? $TMPVAR[\"GET\"] : array()); $_POST = (isset($TMPVAR[\"POST\"]) ? $TMPVAR[\"POST\"] : array()); $_COOKIE = (isset($TMPVAR[\"COOKIE\"]) ? $TMPVAR[\"COOKIE\"] : array()); $_REQUEST = array_merge($_GET, $_POST, $_COOKIE); unset($TMPVAR); chdir('" + path.dirname(filename).replace(/[\\']/g, "\\$&") + "'); include('" + filename.replace(/[\\']/g, "\\$&") + "');", JSON.stringify({GET: get_data, POST: post_data, COOKIE: cookies})]);
                        cmd = proc.spawn(php_cmd, [process.cwd() + "/run_php.php", "dir=" + path.dirname(filename).replace(/[\\']/g, "\\$&"), "file=" + filename.replace(/[\\']/g, "\\$&"), "data=" + JSON.stringify({GET: get_data, POST: post_data, COOKIE: cookies})]);
                    } else if (jsext !== false) {
                        if (debug) {
                            /// Start node in debugging mode.
                            ///NOTE: In some (or all) versions of node.js (0.5.4-), --debug-brk will not work with symlinks; therefor, we must find the real path via realpathSync().
                            cmd = proc.spawn("node", ["--debug" + (brk ? "-brk" : ""), fs.realpathSync(filename), JSON.stringify([get_data, post_data])]);
                            
                            /// Start the debugger script.
                            debug_cmd = proc.spawn("node", [__dirname + "/node-inspector/bin/inspector.js", "--web-port=" + (debug_port ? debug_port : (port === 8888 ? "8000" : "8888"))]);
                            
                            debug_cmd.stdout.on("data", function (data)
                            {
                                if (feedback) {
                                    console.warn(data.toString());
                                }
                            });
                            
                            debug_cmd.stderr.on("data", function (data)
                            {
                                if (feedback) {
                                    console.error(data.toString());
                                }
                            });
                            
                            debug_cmd.on("exit", function (code) {});
                        } else {
                            cmd = proc.spawn("node", [filename, JSON.stringify({GET: get_data, POST: post_data})]);
                        }
                    }
                    
                    cmd.stdout.on("data", function (data)
                    {
                        var header,
                            header_obj = [],
                            header_split,
                            i;
                        
                        if (waiting_for_headers) {
                            header = data.toString().split(/\r\n/g);
                            
                            while (header.length >= 1) {
                                /// If reached the end of the header, go to body.
                                if (header[0] === "") {
                                    waiting_for_headers = false;
                                    break;
                                }
                                
                                ///TODO: Determine if this needs to be better.
                                ///NOTE: Time stamps have colons, thus the space after the colon.
                                header_split = header[0].split(/: /g);
                                
                                /// If this line does not look like a header, go to body.
                                ///TODO: Look for HTTP/#.# ### VALUE
                                ///TODO: Look for Status: 302 Moved Temporarily type things.
                                if (header_split.length !== 2) {
                                    waiting_for_headers = false;
                                    break;
                                }
                                
                                if (header_split[0] === "Status") {
                                    response_value = parseInt(header_split[1]);
                                }
                                
                                /// Must use an array, not an object, because there can be multiple cookies.
                                header_obj[header_obj.length] = [header_split[0], header_split[1]];
                                
                                /// Shift the header so that we can use join() later.
                                header.shift();
                            };
                            response.writeHead(response_value, header_obj);
                            
                            /// Combind the body into one string.
                            data = header.join("");
                        }
                        
                        if (!waiting_for_headers) {
                            response.write(data);
                        }
                    });
                    
                    cmd.stderr.on("data", function (data)
                    {
                        /// Display any errors in the console.
                        if (feedback) {
                            console.error(data.toString());
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
    
    if (request.headers.cookie) {
        cookies = {};
        request.headers.cookie.split(";").forEach(function (cookie) {
            var parts = cookie.split("=");
            cookies[parts[0].trim()] = (parts[1] || "").trim();
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
        
        request.on("data", function (chunk)
        {
            /// Get the POST data.
            post_data += chunk.toString();
        });
        
        request.on("end", function (chunk)
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
