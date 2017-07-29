var webdriver = require('selenium-webdriver');
 logging = webdriver.logging,
 chrome = require('selenium-webdriver/chrome'),
 chromePath = require('chromedriver').path,
 async = require('async'),
 until = webdriver.until,
 path = require('path'),
 By = webdriver.By;
var chrome = require('selenium-webdriver/chrome');
var moment = require('moment');
var path = require('chromedriver').path;
var config = require('./config');
var Promise = require('promise');
var http = require(`http`);
var mongoose = require(`mongoose`);
//the index for the first question in the set of four (images, multiple choice) NOT short answer questions
var count = 1;

//initialization fun
var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

var driver = new webdriver.Builder()
   .withCapabilities(webdriver.Capabilities.chrome())
   .build();

mongoose.connect(config.database)
    .then(function(resp){
        console.log(`Successfully connected to DB!`);
    })
    .catch(function(err){
        console.log(err);
    });

//Bot cycle
login()
    .then(function(){
        console.log('Logged in!');
        goToAssignment()
            .then(function(){
                console.log('Successfuly loaded page!');
                detectType();
            })
            .catch(function(err){
                console.log(err);
            });
    })
    .catch(function(err){
        console.log(err);
    });


//Bot functions
function login(username, password){
    driver.get(`https://www.vocabulary.com/login`);
    return new Promise(function(fufill, reject){
        driver.wait(until.elementLocated(By.name('username')), 100000, 'Could not locate the child element within the time specified').then(function(){
            driver.findElement(By.name('username')).sendKeys(config.user.username);
            driver.findElement(By.name('password')).sendKeys(config.user.password);
            driver.findElement(By.xpath('//*[@id="loginform"]/div[6]/button')).click().then(function(){
                fufill();
            });  
        }, function(err){
            console.log('Trying to reload the page. There was an error receiving the page or the program is out-of-date.')
            reject(err);
        });
    });
}

function goToAssignment(){
    return new Promise(function(fufill, reject){
        if(config.settings.lessonURL.includes('practice')){
           driver.get(config.settings.lessonURL)
                .then(function(){
                    fufill();
                })
                .catch(function(err){
                    reject(err);
                });
        } else {
            config.settings.lessonURL = config.settings.lessonURL + '/practice';
            driver.get(config.settings.lessonURL)
                .then(function(){
                    fufill();
                })
                .catch(function(err){
                    reject(err);
                });
        }
 
    });

}

function detectType(){
    return new Promise(function(fufilled, reject){
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + count + ']'))
            .then(function(a1){
                driver.findElement(By.xpath(`//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[3]`)).getText()
                    .then(function(prompt){
                        console.log(prompt);
                    })
                    .catch(function(error){
                        console.log(error);
                    });
            })
            .catch(function(err){
                console.log(err);
            });
    })

}



