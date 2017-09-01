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
var qs = require('querystring');
//the index for the first question in the set of four (images, multiple choice) NOT short answer questions
var count = 1;
var apiToken;
let choices = [1, 2, 3, 4];
let tempChoices = choices;
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
                'name': config.login.username,
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
                                                    console.log(prompt);
                                                    findStringWord(prompt, a1, a2, a3, a4)
                                                        .then(function (data) {
                                                            //if(!data.answer){
                                                            guessRandomStringWord()
                                                                .then(function (randomNumber1) {
                                                                    isCorrectMultipleChoice()
                                                                        .then(function (isCorrect1) {
                                                                            if (isCorrect1) {
                                                                                extractCorrectStringWord(randomNumber1)
                                                                                    .then(function (correctAnswer1) {
                                                                                        saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer1)
                                                                                            .then(function () {
                                                                                                console.log(`Saving stringWord!`);
                                                                                                moveThroughAll()
                                                                                                    .then(function(){
                                                                                                        console.log(`Moved through all`);
                                                                                                    })
                                                                                                    .catch(function(moveThrough){

                                                                                                    });
                                                                                            })
                                                                                            .catch(function (errSaveStringWord1) {
                                                                                                console.log(errSaveStringWord1);
                                                                                            });
                                                                                    })
                                                                                    .catch(function (err) {

                                                                                    });
                                                                            } else if (!isCorrect1) {
                                                                                guessRandomStringWord()
                                                                                    .then(function (randomNumber2) {
                                                                                        isCorrectMultipleChoice()
                                                                                            .then(function (isCorrect2) {
                                                                                                if (isCorrect2) {
                                                                                                    extractCorrectStringWord(randomNumber2)
                                                                                                        .then(function (correctAnswer2) {
                                                                                                            saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer2)
                                                                                                                .then(function () {
                                                                                                                    console.log(`Saving stringWord!`);
                                                                                                                })
                                                                                                                .catch(function (errSaveStringWord2) {
                                                                                                                    console.log(errSaveStringWord2);
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (err) {

                                                                                                        });
                                                                                                } else if (!isCorrect2) {
                                                                                                    guessRandomStringWord()
                                                                                                        .then(function (randomNumber3) {
                                                                                                            isCorrectMultipleChoice()
                                                                                                                .then(function (isCorrect3) {
                                                                                                                    if (isCorrect3) {
                                                                                                                        extractCorrectStringWord(randomNumber3)
                                                                                                                            .then(function (correctAnswer3) {
                                                                                                                                saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer3)
                                                                                                                                    .then(function () {
                                                                                                                                        console.log(`Saving stringWord!`);
                                                                                                                                    })
                                                                                                                                    .catch(function (errSaveStringWord3) {
                                                                                                                                        console.log(errSaveStringWord3);
                                                                                                                                    });
                                                                                                                            })
                                                                                                                            .catch(function (err) {

                                                                                                                            });
                                                                                                                    } else if (!isCorrect3) {
                                                                                                                        guessRandomStringWord()
                                                                                                                            .then(function (randomNumber4) {
                                                                                                                                isCorrectMultipleChoice()
                                                                                                                                    .then(function (isCorrect4) {
                                                                                                                                        if (isCorrect4) {
                                                                                                                                            extractCorrectStringWord(randomNumber4)
                                                                                                                                                .then(function (correctAnswer4) {
                                                                                                                                                    saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer4)
                                                                                                                                                        .then(function () {
                                                                                                                                                            console.log(`Saving stringWord!`);
                                                                                                                                                        })
                                                                                                                                                        .catch(function (errSaveStringWord4) {
                                                                                                                                                            console.log(errSaveStringWord4);
                                                                                                                                                        });
                                                                                                                                                })
                                                                                                                                                .catch(function (err) {

                                                                                                                                                });
                                                                                                                                        } else if (!isCorrect4) {

                                                                                                                                        }
                                                                                                                                    })
                                                                                                                                    .catch(function () {

                                                                                                                                    })
                                                                                                                            })
                                                                                                                            .catch(function () {

                                                                                                                            });
                                                                                                                    }
                                                                                                                })
                                                                                                                .catch(function () {

                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function () {

                                                                                                        });
                                                                                                }
                                                                                            })
                                                                                            .catch(function () {

                                                                                            });

                                                                                    })
                                                                                    .catch(function () {

                                                                                    });
                                                                            }
                                                                        })
                                                                        .catch(function () {
                                                                            console.log(isCorrectError);
                                                                        });
                                                                })
                                                                .catch(function (errorGuess1) {
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

//in beta
function guessRandomStringWord() {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            var randomNumber = Math.floor(Math.random() * tempChoices.length);
            var randomChoice = tempChoices[randomNumber];
            console.log(randomChoice);
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + randomChoice + ']')).click()
                .then(function (resp) {
                    tempChoices.splice(randomNumber, 1);
                    console.log(tempChoices);
                    fufill(randomChoice);
                })
                .catch(function (err) {
                    reject(err);
                });
        }, 2000);
    });
}


function extractCorrectStringWord(correctIndex) {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            console.log(`Extracting correct answer!`);
            var added = count + correctIndex - 1;
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + added + ']')).getText()
                .then(function (text) {
                    console.log(text);
                    fufill(text);
                })
                .catch(function (err) {
                    reject(err);
                });
        }, 250);
    });
}

function saveStringWord(prompt, a1, a2, a3, a4, lessonURL, addedBy, correctAnswer) {
    return new Promise(function (fufill, reject) {
        var postData = {
            token: apiToken,
            prompt: prompt,
            a1: a1,
            a2: a2,
            a3: a3,
            a4: a4,
            lessonURL: lessonURL,
            addedBy: addedBy,
            correctAnswer: correctAnswer
        };
        console.log(`Saving stringWord to DB`);
        const options = {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            uri: config.api.url + `/stringWord/create`,
            method: `POST`,
            body: qs.stringify(postData)
        }
        request(options)
            .then(function (resp) {
                console.log(resp);
                fufill();
            })
            .catch(function (error) {
                console.log('ERROR');
                reject(error);
            });
    });

}//*[@id="challenge"]/div/div[1]/div[2]/div/div/section[1]/div[2]

function isCorrectMultipleChoice() {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            driver.findElement(By.xpath(`//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[2]`))
                .then(function (resp) {
                    resp.getAttribute('class')
                        .then(function (classes) {
                            console.log('This element has classes: ' + classes);
                            if (classes.includes('correct')) {
                                fufill(true);
                            } else {
                                fufill(false);
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


        });
    }, 1000);

}



function moveThroughAll(){
    return new Promise(function(resolve, reject){
        for(let i = 0; i < 10; i++) {
            driver.findElement(By.xpath(`//*[@id="challenge"]/div/div[2]/button`)).getAttribute(`class`)
                .then(function(classes){
                    if(classes.includes(`active`)){
                        driver.findElement(By.xpath(`//*[@id="challenge"]/div/div[2]/button`)).click()
                            .then(function(clicked){
                                console.log(i);
                            })
                            .catch(function(errClick){
                                reject(errClick);
                            });
                    } else {
                        return;
                    }
                })
                .catch(function(err){
                    reject(err);
                });
        }
    });
}


