/*jslint onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, node: true, indent: 4, white: false */

/// For help: node dynamic_server.js --help

var fs    = require("fs"),
    http  = require("http"),
    path  = require("path"),
    spawn = require('child_process').spawn,
    url   = require("url"),
    qs    = require("querystring"),
    
    brk   = false,
    debug = false,
    jsext = "js",
    php   = false,
    port  = 8888; /// Defaults to port 8888

(function ()
{
    var i = 2,
        param_len = process.argv.length;
    
    for (; i < param_len; i += 1) {
        if (process.argv[i] === "-debug" || process.argv[i] === "--debug") {
            debug = true;
        } else if (process.argv[i] === "-debug-brk" || process.argv[i] === "--debug-brk") {
            debug = true;
            brk   = true;
        } else if (process.argv[i] === "--php") {
            php = true;
        } else if (process.argv[i].substr(0, 5) === "--js=") {
            jsext = process.argv[i].slice(5);
            /// Remove a leading dot.
            if (jsext.substr(0, 1) === ".") {
                jsext = jsext.slice(1);
            }
        } else if (process.argv[i] === "-help" || process.argv[i] === "--help" || process.argv[i] === "-h") {
            console.log("Usage: node dynamic_server.js [options] [PORT]");
            console.log("");
            console.log("Examples:");
            console.log("  node dynamic_server.js");
            console.log("  node dynamic_server.js 8080");
            console.log("  node dynamic_server.js --js=jss");
            console.log("  node dynamic_server.js --debug");
            console.log("  node dynamic_server.js --debug-brk --php 8080");
            console.log("");
            console.log("  --debug     Run in debug mode");
            console.log("  --debug-brk Run in debug mode, and start with a break");
            console.log("  --help, -h  This help");
            console.log("  --js=ext    Set the file extension of JavaScript files to execute (default: js)");
            console.log("  --php       Enable execution of .php files");
            console.log("");
            console.log("Latest verion can be found at https://github.com/nmrugg/DynamicJS");
            process.exit();
        } else if (Number(process.argv[i]) > 0) {
            port = Number(process.argv[i]);
        } else {
            console.log("Warning: Unrecognized option " + process.argv[i]);
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
    
    process.exit(1);
})

/// Start the server.
http.createServer(function (request, response)
{
    var filename,
        post_data = "",
        uri = url.parse(request.url).pathname;
    
    filename = path.join(process.cwd(), uri);
    
    function request_page(post_data)
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
            
            /// If the URI is a directory, try to load index.js, then index.html, then index.htm.
            if (fs.statSync(filename).isDirectory()) {
                if (path.existsSync(filename + "/index." + jsext)) {
                    filename += "/index." + jsext;
                } else if (path.existsSync(filename + "/index.html")) {
                    filename += "/index.html";
                } else {
                    filename += "/index.htm";
                }
            }
            
            /// The dynamic part:
            /// If the file is a JavaScript file, execute it and write the results.
            if (filename.slice(-3) === "." + jsext) {
                ///NOTE: Executing a command is not secure, but right now, node always caches files that are require'd().
                (function ()
                {
                    var cmd,
                        debug_cmd,
                        get_data,
                        has_written_head = false,
                        url_arr = request.url.split("?");
                    
                    /// Parse GET data, if any.
                    if (url_arr.length > 1) {
                        ///NOTE: GET data can be retrieved via the following code:
                        ///      get_data = JSON.parse(process.argv[2]).GET;
                        get_data = qs.parse(url_arr[1]);
                    }
                    
                    if (debug) {
                        /// Start node in debugging mode.
                        cmd = spawn("node", ["--debug" + (brk ? "-brk" : ""), filename, JSON.stringify({GET: get_data, POST: post_data})]);
                        
                        /// Start the debugger script.
                        debug_cmd = spawn("node", [__dirname + "/node-inspector/bin/inspector.js", "--web-port=" + (port === 8888 ? "8000" : "8888")]);
                        
                        debug_cmd.stdout.on("data", function (data)
                        {
                            console.log(data.toString());
                        });
                        
                        debug_cmd.stderr.on("data", function (data)
                        {
                            console.log(data.toString());
                        });
                        
                        debug_cmd.on("exit", function (code) {});
                    } else {
                        cmd = spawn("node", [filename, JSON.stringify({GET: get_data, POST: post_data})]);
                    }
                    
                    cmd.stdout.on("data", function (data)
                    {
                        if (!has_written_head) {
                            response.writeHead(200);
                            has_written_head = true;
                        }
                        response.write(data);
                    });
                    
                    cmd.stderr.on("data", function (data)
                    {
                        /// Display any errors in the console.
                        console.log(data.toString());
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
    
    /// Is there POST data?
    if (request.method === "POST") {
        
        request.on("data", function(chunk)
        {
            /// Get the POST data.
            post_data += chunk.toString();
        });
        
        request.on("data", function(chunk)
        {
            ///NOTE: POST data can be retrieved via the following code:
            ///      post_data = JSON.parse(process.argv[2]).POST;
            request_page(qs.parse(post_data));
        });
        
    } else {
        request_page();
    }
}).listen(port);

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");