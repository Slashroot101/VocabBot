//essential selenium vars
var webdriver = require('selenium-webdriver');
logging = webdriver.logging,
    chrome = require('selenium-webdriver/chrome'),
    chromePath = require('chromedriver').path,
    async = require('async'),
    until = webdriver.until,
    path = require('path'),
    By = webdriver.By;
var chrome = require('selenium-webdriver/chrome');
var path = require('chromedriver').path;
var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

//bot utility files
var config = require('./config');
var login = require('./utility/login');
var errorHandler = require('./utility/error');

login.login(driver, config)
    .then(function(login){
        if(login){

        } else {
            driver.quit();
        }
    })
    .catch(function(err){

    });