[DynamicJS](https://github.com/nmrugg/DynamicJS): A simple Node HTTP server that dynamically executes JavaScript

Usage: <pre>node dynamic_server.js [PORT] [debug]</pre>

Examples:
Start the server like normal and listen on the default port:
<pre>node dynamic_server.js</pre>

Start the server like normal and listen on port 8080:
<pre>node dynamic_server.js 8080</pre>

Start the server in debugging mode and listen on port 8888 (the default port):
<pre>node dynamic_server.js 8888 debug</pre>


NOTE:
In order to debug, you need to use [node-inspector](http://github.com/dannycoates/node-inspector).  You can either extract the zipped copy,
or better yet, grab the latest code from the git repository.  When running in debugging mode, a second node process is started.  Currently,
you must access the debugger in a WebKit-based browser, like Chrome or Safari.