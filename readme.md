DynamicJS: A simple Node HTTP server that dynamically executes JavaScript
https://github.com/nmrugg/DynamicJS

Usage: node dynamic_server.js [PORT] [debug]

Examples:
Start the server like normal and listen on the default port:
$ node dynamic_server.js

Start the server like normal and listen on port 8080:
$ node dynamic_server.js 8080

Start the server in debugging mode and listen on port 8888 (the default port):
$ node dynamic_server.js 8888 debug 


NOTE:
In order to debug, you need to use [node-inspector](http://github.com/dannycoates/node-inspector).  You can either extract the zipped copy,
or better yet, grab the latest code from the git repository.  When running in debugging mode, a second node process is started.  Currently,
you must access the debugger in a WebKit-based browser, like Chrome or Safari.
