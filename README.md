[![Build Status](https://travis-ci.org/atogov/RAM.svg?branch=develop)](https://travis-ci.org/atogov/RAM)

# Architecture

![System Architecture](https://raw.githubusercontent.com/atogov/RAM/develop/docs/images/system-architecture.png)

# High level system functionality - User UI Flow

![High Level Functionality ](https://raw.githubusercontent.com/atogov/RAM/develop/docs/images/ui-flow.png)

# Data Model (*In TypeScript format* [here](https://raw.githubusercontent.com/atogov/RAM/develop/docs/data-types.ts))
![Data Model](https://raw.githubusercontent.com/atogov/RAM/develop/docs/images/data-model.png)

# Rest API - Work in progress - [here](https://raw.githubusercontent.com/atogov/RAM/develop/docs/data-types.ts)

# Useful resources:
 1. [Development Environment](docs/environment.md)
 1. [Git Usage](docs/git-usage.md)
 1. [Postman Collections](docs/postman.md)

## Development Environment Installation

* Create a (GitHub)[http://github.com] account if you do not already have one.
* Log in to your GitHub account
* Go to https://github.com/atogov/RAM
* Select the _Fork_ button from the top right
  * If you have not yet created a fork, you will be given that option now
    * Read https://help.github.com/articles/fork-a-repo/ for instructions. This will give you a repository in your own account that synchronises from the ATO RAM repository. As you make changes, use pull requests to update the main repository. Don't forget to merge from ATO before creating a pull request back.

### Windows
* Download the Github downloader/installer
  * Click on https://github-windows.s3.amazonaws.com/GitHubSetup.exe
  * and accept the download to save it
  * Once downloaded, run the exe
* The GitHub GUI should open once install is complete
  * Change shell to Bash
    * Select the tool icon on the top right
    * Selection _Options..._ from the menu
    * In the _Default shell_ section, choose **Git Bash**
* While there configure your GitHub account, clone path, etc
    * Close the options
    * To use SourceTree for reviewing / merging pull requests, you need to modify _.git/config_ file as described [here](https://gist.github.com/piscisaureus/3342247). In short, add the following:
        [remote "atogov"]
            fetch = +refs/pull/\*/head:refs/remotes/origin/pr/\*
* Run a git bash shell
  * from the GitHub GUI client
    * Select the tool icon on the top right
    * Selection _Open in Git Shell_ from the menu
  * curl -SLO https://raw.githubusercontent.com/atogov/RAM/develop/install/ram-dev-win.sh
  * ./ram-dev-win.sh _your-github-name_
    * Clones a local copy of your FORK of RAM
    * Uses _npm/tsd/jspm_ to install dependencies
    * Installs MongoDB
    * Installs Node 6.x.x
    * Installs Visual Studio Code

## Windows Manual installation - Windows 7
 * Download and install latest version of MongoDB
 * Install python 2.7 and make sure it is also on the PATH
 * Install NodeJs 6.x.x
 * npm config set python python2.7 --global
 * npm config set msvs_version 2015 --global
 * Install VC++ Build Tools Technical Preview from http://go.microsoft.com/fwlink/?LinkId=691132, choose Custom Install, and select both Windows 8.1 and Windows 10 SDKs.
 * npm install typescript tslint eslint gulp-cli jasmine jspm -g
 * cd backend; npm install
 * cd frontend; npm install; jspm install

## Some further notes - getting it running on Windows 10

Rather than running the ram-dev-win.sh file above, I did things manually
  * Installed git as per usual and cloned project
  * Installed MongoDB
    * from https://www.mongodb.com/download-center?jmp=nav#community
    * downloaded `Windows Server 2008 R2 64-bit and later, with SSL support`
    * created `c:\data\db`
    * opened up a command line to `C:\Program Files\MongoDB\Server\3.2\bin` and ran `mongod`
    * Installed RoboMongo to check it was working
  * Installed NodeJs latest 6.x.x from https://nodejs.org/en/ (not the recommended 4.x.x)
  * Installed Python 2.7 (not 3.x)
  * Ran `npm install --global --production windows-build-tools`
    * note bash shell has to be running as administrator
  * Set `RAM_CONF` as a user environment variable
    * `Win-Break > Change settings > Advanced > Environment variables > New`
    * Variable name: `RAM_CONF`
    * Variable value: `Q:\<path to code>\RAM\backend\conf\conf-localhost.js`
    * (and make sure to restart your shell)
  * Ran `./ram deps:backend`, `./ram deps:frontend`, `./ram db:seed` etc as per usual

## AWS Install

* Each server requires its own configuration file. Template configuration file at _conf/conf.js_. You must set an environment variable called *RAM_CONF* pointing to the absolute path of your configuration file.
Once you set your *RAM_CONF* environment variable you can run the server by calling _gulp serve_.

* SSH to the server
  * curl -SLO https://raw.githubusercontent.com/atogov/RAM/develop/install/aws.sh
  * **sudo bash aws-init.sh**
    * creates /etc/nginx/nginx.conf
    * installs NGINX
    * installs Nodejs
    * installs MongoDB
    * creates /ram/update.sh
    * runs /ram/update.sh
      * downloads and unpacks latest copy of RAM from GitHub
      * _npm update_ to update dependencies
      * restart RAM server

### From the Server

SSH to the server and run _/ram/update.sh hhhhhh_ where **hhhhhh** is the hash of the commit you want to run. It can also be a tag or branch name. If not supplied, _develop_ is used.

### From the UI (Dev env only)

From a browser run http://ramvm01.expoctest.com/dev. Enter a branch/tag/hash and press the appropriate button.

## The Development Process

* Fork and clone https://github.com/atogov/RAM if you haven't already. This need only be done once per developer.
* Open Git Shell
* Run _./ram.sh backend server&_
* Run _./ram.sh frontend server&_
* Wait patentially. Eventually a browser page will open
* For each task:
  * Refresh your clone from RAM or another fork if that is the base you need.
  * Repeat...
    * Enable tests you want to work on.
    * Run Jasmine for a service called _nnnnn_. If the optional describe text is provided, only the _describe()_ that matches the text will run. Otherwise all tests in the file execute.
    * If it fails, add code to one of the service actions

## The ```ram``` script

At the root of the project, there is a ```ram``` script which provides a self documenting list of useful commands from setting up the environment to running the frontend/backend and executing tests. You can see the list of commands simply by executing:

* ```./ram```

Here is a list of support commands:

```Usage:

       ram <command>

   Commands:

       setup                                      Setups local workstation
       deps                                       Downloads all dependencies
       deps:frontend                              Downloads frontend dependencies
       deps:backend                               Downloads backend dependencies
       deps:test                                  Downloads api test dependencies
       deps:clean                                 Removes node_modules and typings folders
       jspm                                       Builds the jspm dist file

       feature:start                              Creates local and remote feature branch
       feature:checkout                           Fetches then checks out remote feature branch
       feature:finish                             Opens Github to manually submit pull request
       feature:cancel                             Deletes local and remote feature branch
       feature:merge:origin                       Merges origin/develop to current local feature branch

       lint:frontend                              Runs lint on frontend
       lint:backend                               Runs lint on backend

       compile:frontend                           Runs compile on frontend
       compile:backend                            Runs compile on backend

       test:backend                               Runs backend tests
       test:api                                   Runs API tests

       start:frontend                             Starts local frontend server
       start:backend                              Starts local backend server
       start:frontend-no-lint                     Starts local frontend server without linting
       start:backend-no-lint                      Starts local backend server without linting

       debug:backend                              Starts local backend server without linting and debug port open

       db:seed                                    Seeds local database
       db:export                                  Exports example data from local database

       chrome                                     Opens chrome in application mode
       clean                                      Cleans all generated files
       swagger                                    Opens browser to swagger apis on local server
       staging                                    Opens browser to staging instance
       github                                     Opens browser to github repository
       wiki                                       Opens browser to project wiki
       merge:upstream <branch>                    Merges from upstream, <value> is branch name (eg develop)
```

For the ```test```, you can limit the test by a pattern. For example:

```./ram test:backend --test relationshipType.model```

## Jasmine from the Client
You may prefer to test your service from a browser. You can then select individual tests as needed. The browser will need to include

* _RAM/microservices/node_modules/ram/service/request.js_
* _RAM/microservices/nnnnn/spec.js_

## PM2 - Production Process Manager

Full use has yet to be explored. For development the watch can be set to restart on file changes. To do this we need to set up environments so that it only does so on development. This is a matter of setting and using environent variable within _ecosystem.json_.

## JSPM & Travis

While using jspm, specifically `jspm install` you can run into the error `GitHub rate limit reached.`. This is due to
github rate limiting by IP address, which happens quite often while using Travis.

This is the [recommended solution from jspm](http://jspm.io/docs/registries.html):

- login to github
- create a personal access key with the `public_repo` scope
- run on your computer `jspm registry config github` and enter your github login and access key
- export the auth key defined after `jspm config registries.github.auth `
- login to travis to your fork and create the environment variable `JSPM_GITHUB_AUTH_TOKEN` and set this jspm auth key

## Travis

While working on the travis configuration file you can validate it using the following commands

- `rvm install 2.1.5`
- `rvm gemset create ram`
- `rvm use 2.1.5@ato-ram`
- `gem install travis`
- `travis lint`

## Credits

Creation of favicon to [Alexandr Cherkinsky](https://thenounproject.com/cherkinskiy/).

Cross browser testing using [BrowserStack](https://www.browserstack.com/).

## Technology documentation

https://angular.io/docs/ts/latest/

https://xgrommx.github.io/rx-book/

## Intellij IDEA/Webstorm configuration

* Install plugins for Angular 2...
* Exclude folders:
    * dist
    * node_modules
    * frontend/bower_components
    * frontend/node_modules
    * backend/dist
    * backend/node_modules
* Add folders to Preferences > Language & Frameworks > Javascript > Libraries so that IDEA can find the resources:
    * frontend/dist
    * frontend/node_modules
    * backend/dist
    * backend/node_modules


Quick Start
===========
 
Prerequisites:
 
 * Node 6.1.0
 * Running Mongo instance
 
To run locally for development:
 
```
 git clone https://github.com/atogov/RAM.git
 cd RAM
 
 ./ram deps
 ./ram jspm
 ./ram db:seed

 ./ram start:backend 
 ./ram start:frontend
 
 open http://localhost:3001/dev/
```