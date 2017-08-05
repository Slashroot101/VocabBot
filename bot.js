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
var request = require('request-promise');
var mongoose = require(`mongoose`);
//the index for the first question in the set of four (images, multiple choice) NOT short answer questions
var count = 1;
var apiToken;
//initialization fun
var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

mongoose.connect(config.database)
    .then(function (resp) {
        console.log(`Successfully connected to DB!`);
    })
    .catch(function (err) {
        console.log(err);
    });




//Bot cycle
login()
    .then(function () {
        console.log('Logged in!');
        goToAssignment()
            .then(function () {
                console.log('Successfuly loaded page!');
                getToken()
                    .then(function (data) {
                        console.log(data);
                        detectTypeAndAnswer()
                            .then(function (type) {
                                guessRandomStringWord()
                                    .then(function (randomNumber) {
                                        isCorrectMultipleChoice(randomNumber)
                                            .then(function (isCorrect) {

                                            })
                                            .catch(function (isCorrectError) {

                                            });
                                    })
                                    .catch(function (errRandomWord) {

                                    });
                            })
                            .catch(function (errType) {

                            })
                    })
                    .catch(function (error) {
                        console.log(error);
                    });

            })
            .catch(function (err) {
                console.log(err);
            });
    })
    .catch(function (err) {
        console.log(err);
    });


//Bot functions
function login(username, password) {
    driver.get(`https://www.vocabulary.com/login`);
    return new Promise(function (fufill, reject) {
        driver.wait(until.elementLocated(By.name('username')), 100000, 'Could not locate the child element within the time specified').then(function () {
            driver.findElement(By.name('username')).sendKeys(config.user.username);
            driver.findElement(By.name('password')).sendKeys(config.user.password);
            driver.findElement(By.xpath('//*[@id="loginform"]/div[6]/button')).click().then(function () {
                fufill();
            });
        }, function (err) {
            console.log('Trying to reload the page. There was an error receiving the page or the program is out-of-date.')
            reject(err);
        });
    });
}

function getToken() {
    return new Promise(function (fufill, reject) {
        const options = {
            method: `POST`,
            uri: config.api.url + `/login`,
            body: {
                'username': config.login.username,
                'password': config.login.password
            },
            json: true
        }

        request(options)
            .then(function (resp) {
                apiToken = resp.token;
                fufill(resp);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

function goToAssignment() {
    return new Promise(function (fufill, reject) {
        if (config.settings.lessonURL.includes('practice')) {
            driver.get(config.settings.lessonURL)
                .then(function () {
                    fufill();
                })
                .catch(function (err) {
                    reject(err);
                });
        } else {
            config.settings.lessonURL = config.settings.lessonURL + '/practice';
            driver.get(config.settings.lessonURL)
                .then(function () {
                    fufill();
                })
                .catch(function (err) {
                    reject(err);
                });
        }

    });

}

//detects question type and strips data
function detectTypeAndAnswer() {
    return new Promise(function (fufilled, reject) {
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + count + ']')).getText()
            .then(function (a1) {
                driver.findElement(By.xpath(`//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[3]`)).getText()
                    .then(function (prompt) {
                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 1) + ']')).getText()
                            .then(function (a2) {
                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 2) + ']')).getText()
                                    .then(function (a3) {
                                        console.log(a3);
                                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 3) + ']')).getText()
                                            .then(function (a4) {
                                                if (prompt.toLowerCase().indexOf('means') != -1 || prompt.toLowerCase().indexOf('opposite') != -1) {
                                                    console.log('This must be a stringWord sentence!');
                                                    console.log(prompt.replace(/\s/g, '').replace('means', '').replace(':', '').replace('to', ''));
                                                    findStringWord(prompt.replace(/\s/g, '').replace('means', '').replace(':', '').replace('to', ''), a1, a2, a3, a4)
                                                        .then(function (data) {
                                                            console.log(`test`);
                                                            //if(!data.answer){
                                                            guessRandomStringWord()
                                                                .then(function (resp) {
                                                                    isCorrectMultipleChoice(resp)
                                                                        .then(function (isCorrect) {

                                                                        })
                                                                        .catch(function (isCorrectError) {

                                                                        });
                                                                })
                                                                .catch(function (errorGuess) {
                                                                    console.log(errorGuess);
                                                                });
                                                            //post new stringWord
                                                            //random guess
                                                            //} else {
                                                            //answerQuestion
                                                            //}
                                                        })
                                                        .catch(function (errorStringWord) {
                                                            console.log(errorStringWord)
                                                        });
                                                } else {
                                                    console.log('This must be the sentenceWord sentence!');
                                                }
                                            })
                                            .catch(function (errora4) {

                                            });
                                    })
                                    .catch(function (errora3) {
                                        console.log(errora3);
                                    });
                            })
                            .catch(function (errora2) {
                                console.log(errora2);
                            });
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            })
            .catch(function (err) {
                console.log(err);
            });
    })
}

function findStringWord(prompt, a1, a2, a3, a4) {
    return new Promise(function (fufill, reject) {
        const options = {
            method: `GET`,
            uri: config.api.url + `/stringWord/find`,
            qs: {
                token: apiToken,
                prompt: prompt,
                a1: a1,
                a2: a2,
                a3: a3,
                a4: a4
            }
        }
        request(options)
            .then(function (resp) {
                fufill(resp);
            })
            .catch(function (error) {
                reject(error);
            });
    });
};


function getRandomIndex() {
    return Math.floor(count + (Math.random() * 3));
}

function guessRandomStringWord() {
    return new Promise(function (fufill, reject) {
        var randomNumber = getRandomIndex();
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + randomNumber + ']')).click()
            .then(function (resp) {
                console.log('Success!')
                fufill(randomNumber);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

//*[@id="challenge"]/div/div[1]/div[2]/div/div/section[1]/div[2]
//TODO: not working
function isCorrectMultipleChoice() {
    return new Promise(function (fufill, reject) {
        if (count === 1) {
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[2]'))
                .then(function (resp) {
                    resp.getAttribute('class')
                        .then(function (classes) {
                            console.log('This element has classes: ' + classes);
                            if (classes.includes('correct')) {
                                fufill('Correct!');
                            } else {
                                fufill('Incorrect!');
                            }
                        })
                        .catch(function (errClass) {
                            console.log(errClass);
                            reject(errClass)
                        });
                })
                .catch(function (err) {
                    console.log(err);
                    reject(err);
                });
        } else {
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div[' + count + ']/div/div/section[1]/div[2]'))
                .then(function(resp){
                    resp.getAttribute('class')
                        .then(function(classes){
                            console.log('This element has classes: ' + classes);
                            if(classes.includes('correct')){
                                fufill('Correct!');
                            } else {
                                fufill('Incorrect!');
                            }
                        })
                        .catch(function(errClass){
                            console.log(errClass);
                            reject(errClass)
                        });
                })
                .catch(function(err){
                    console.log(err);
                    reject(err);
                });
        }

    });
}



