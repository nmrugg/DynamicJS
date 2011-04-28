/*jslint onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, node: true, indent: 4, white: false */

/// Usage: node dynamic_server.js PORT

var fs    = require("fs"),
    http  = require("http"),
    path  = require("path"),
    spawn = require('child_process').spawn,
    url   = require("url"),
    qs    = require('querystring'),
    
    port  = process.argv[2] || 8888, /// Defaults to port 8888
    debug = process.argv[3] === "debug" ? true : false;

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
                if (path.existsSync(filename + "/index.js")) {
                    filename += "/index.js";
                } else if (path.existsSync(filename + "/index.html")) {
                    filename += "/index.html";
                } else {
                    filename += "/index.htm";
                }
            }
            
            /// The dynamic part:
            /// If the file is a JavaScript file, execute it and write the results.
            if (filename.slice(-3) === ".js") {
                ///NOTE: Executing a command is not secure, but right now, node always caches files that are require'd().
                (function ()
                {
                    var cmd,
                        debug_cmd,
                        has_written_head = false;
                    
                    if (debug) {
                        cmd = spawn("node", (typeof post_data === "undefined" ? ["--debug", "--debug-brk", filename] : ["--debug-brk", filename, post_data]));
                        
                        debug_cmd = spawn("node", ["/localhost/DynamicJS/node-inspector/bin/inspector.js", "--web-port=8000"]);
                        
                        debug_cmd.stdout.on("data", function (data)
                        {
                            console.log(data.toString());
                        });
                        
                        debug_cmd.stderr.on("data", function (data)
                        {
                            console.log(data.toString());
                        });
                        
                        debug_cmd.on("exit", function (code)
                        {
                            
                        });
                        
                        
                    } else {
                        cmd = spawn("node", (typeof post_data === "undefined" ? [filename] : [filename, post_data]));
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
            ///      post_data = JSON.parse(process.argv[2]);
            request_page(JSON.stringify(qs.parse(post_data)));
        });
        
    } else {
        request_page();
    }
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");