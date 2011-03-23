/*jslint onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, node: true, indent: 4, white: false */
/*global console */

/// Usage: node dynamic_server.js PORT

var fs    = require("fs"),
    http  = require("http"),
    path  = require("path"),
    spawn = require('child_process').spawn,
    url   = require("url"),
    util  = require('util'),
    
    port = process.argv[2] || 8888; /// Defaults to port 8888

/// Start the server.
http.createServer(function (request, response)
{
    var filename,
        uri = url.parse(request.url).pathname;
    
    filename = path.join(process.cwd(), uri);
    
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
                var cmd = spawn("node", [filename]),
                    has_written_head = false;
                
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
                    if (!has_written_head) {
                        response.writeHead(500, {"Content-Type": "text/plain"});
                        has_written_head = true;
                    }
                    /// Display any errors.
                    response.write(data);
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
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
