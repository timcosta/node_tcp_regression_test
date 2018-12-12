# node_tcp_regression_test
This repository is a minimum reproducible example of a regression in a node between v8.9.4 and v8.14.0, and present in v10.14.2 as well. Node v11.4.0 may have resolved the issue, however tests are inconsistent.

## The Issue
Our ELB on AWS has been reporting a large number of ELB_5XX errors for our servers. We tracked these to TCP hangups based on the 504 status code in the ELB Access logs and the `-` that denoted no back end server was connected to successfully.

## Our archtecture
* Node version: v8.14.0 (from above)
* Hapi version: v16.7.0

## Findings
Node appears to be responding twice in a short period of time to a PUT request, first with an `ACK` and then almost immediately after with an `ACK,RST` packet which is terminating the connection before the response can be delivered, which can be seen in Wireshark here:
![pcap capture](https://i.imgur.com/C0XmDet.png)

This request was sent about 50 seconds after the socket was opened. This is important, because our ELB idle timeout is set to 60 seconds, and our node listener keep alive timeout is set to two minutes (`server.listener.keepAliveTimeout = 1000 * 60 * 2;`)

Based on the above, it doesn't make sense that node/hapi would be sending a `RST` packet after a socket had only been open for 50 seconds, as that time span was lower than either of the configured idle timeouts.

We created a script that opens a socket, waits a period of time, and then issues an HTTP request over the socket. These requests consistently began to error if they were the first request transmitted across the socket, and were sent after the 40 second mark.

For those that don't know, [ELBs pre-warm connections](https://medium.com/@liquidgecka/a-tale-of-unexpected-elb-behavior-5281db9e5cb4) to back end servers. We run a 70 node kubernetes cluster, so in periods of low traffic it is conceivable that a socket is opened and left without any data being transmitted for at least 40 seconds, but less than 60 seconds.

Here's a [test run on Travis](https://travis-ci.com/timcosta/node_tcp_regression_test/builds/94440224) that shows node `v8.9.4` passing, `v8.14.0` and `v10.14.2` failing, and `v11.4.0` passing.

## To Reproduce
* `nvm install 8`
  * ensure latest version of node 8 is installed
* `nvm use 8`
* `SERVER=http node index.js`
  * start server running on port 8000 using node http
* `npm test`
  * to run the socket test at 39 and 41 seconds

The `test` command will show a connection error after the 41 second pause nearly every time in node `v8.14.0+`, but never in node `v8.9.4`.

If you choose to omit the `SERVER=http` portion, a hapi server will be initialized instead of a node http server.
