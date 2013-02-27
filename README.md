# xss.io

by [Adam Baldwin](https://twitter.com/adam_baldwin) ver something.something.alpha 


## Features / About
xss.io is a cross-site scripting (xss) convenience toolkit. It's purpose is to help ease exploitation of xss vulnerabilities.

  - Create and utilize a library of reusable code snippets
  - Quickly create exploit payloads by dragging and dropping snippets
  - Use Referer based redirects to save precious payload space
  - Create and Monitor unique payload drops for blind xss exploitation

## Installation

1. Install Redis 2.6 (required for LUA scripting)
1. Install node.js >= 0.8.4
1. ```git clone git@github.com:evilpacket/xss.io.git```
1. ```cd xss.io```
1. ```npm install .```
1. Setup a twitter app id (for authentication) [somebody should add local auth ;)]
1. Fight with bugs and steps I forgot to include here

## Architecture
xss.io currently runs using node.js and Redis. It's goal is to be always on and fast.

## Warning
Chances are there is something missing that will prevent this for working right for you. Sorry about that. Just drop an issue or pull request and I'll get to it someday.

## Other Contributors
Design by [Adam Brault](https://twitter.com/adambrault)

## License

MIT

xss.io - Copyright (C) 2012 Adam Baldwin

