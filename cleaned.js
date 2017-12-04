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
var mongoose = require('mongoose');
var colors = require('colors');
var qs = require('querystring');
//the index for the first question in the set of four (images, multiple choice) NOT short answer questions
var count = 1;
var stringWordCount = 1;
var queueObject;
var apiToken;
var numAchieve = 0;
let choices = [1, 2, 3, 4];
let tempChoices = choices;
//initialization fun
var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

start();

function start() {
    getCurrentTask()
        .then(function () {
            console.log(config);
            login()
                .then(function () {
                    console.log('Logged in!');
                    goToAssignment(false)
                        .then(function () {
                            console.log('Successfuly loaded page!');
                            getToken()
                                .then(function () {
                                    console.log('Start loop complete!'.blue);
                                    assignmentDriver();
                                })
                                .catch(function (err) {
                                    console.log(err);
                                });

                        })
                        .catch(function (error) {
                            console.log(error + ''.red);
                        });


                })
                .catch(function (err) {
                    console.log(err);
                });

        })
        .catch(function (err) {
            console.log(err);
        });
}

/*  Steps to driving the assignment:
1. 
*/
//this function does all of the driving (moving from question to question, etc)
function assignmentDriver() {
    console.log(apiToken);
    if (stringWordCount > 20) {
        console.log('Stringword count stuck in loop!'.blue);
        goToAssignment(true)
            .then(function () {
                stringWordCount = 1;
                numAchieve = 0;
                assignmentDriver();
            })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        setTimeout(function () {
            isComplete()
                .then(function (exists) {
                    if (exists) {
                        driver.quit();
                    } else {
                        console.log(stringWordCount);
                        isMovable(function () {
                            console.log('Finished moving!'.blue);
                            tempChoices = [1, 2, 3, 4];
                            questionDriver()
                                .then(function () {

                                })
                                .catch(function (answerErr) {
                                    console.log(answerErr);
                                    goToAssignment(true)
                                        .then(function () {
                                            stringWordCount = 1;
                                            numAchieve = 0;
                                            assignmentDriver();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        });
                                });
                        });

                    }
                })
                .catch(function (err) {
                    console.log(err);
                    goToAssignment(true)
                        .then(function () {
                            stringWordCount = 1;
                            numAchieve = 0;
                            assignmentDriver();
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                });
        }, 1000);
    }

}

/*
1. Find the type of question
    If stringWord/Sentence word
        pull correct data and answer with stringWord/SentenceWord method
            if no data, guess random and learn answer

    If audioWord
        pull correct data and answer
            if no data, give up and learn answer

    If imageWord
        pull correct data and answer
            if no data, guess and learn


    QuestionType Classes --

    question TypeD TypeS = stringWord
    question TypeL TypeP TypeH = sentenceWord
    question typeA = oppositeWord
    question TypeF = paragraphWord
    question TypeI = imageWord
    question TypeT = audioWord

*/
function questionDriver() {
    return new Promise(function (fufilled, reject) {
        if (stringWordCount > 1) {
            var countString = '[' + stringWordCount + ']';
        } else {
            var countString = '';
        }
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]'))
            .then(function (dClass) {
                console.log('Assesing the question type!'.blue);
                dClass.getAttribute('class')
                    .then(function (divClass) {
                        console.log(divClass);
                        if (divClass.includes('typeD') || divClass.includes('typeS')) {
                            console.log('Stringword'.yellow);
                            answerStringWord()
                                .then(function () {
                                    setTimeout(function () {
                                        assignmentDriver();
                                    }, 1500);
                                })
                                .catch(function (errSW) {
                                    console.log(errSW);
                                    goToAssignment(true)
                                        .then(function () {
                                            stringWordCount = 1;
                                            numAchieve = 0;
                                            assignmentDriver();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        });
                                });
                        } else if (divClass.includes('typeL') || divClass.includes('typeP') || divClass.includes('typeH')) {
                            console.log('SentenceWord'.yellow);
                            answerSentenceWord()
                                .then(function () {
                                    setTimeout(function () {
                                        assignmentDriver();
                                    }, 1500);
                                })
                                .catch(function (errS) {
                                    console.log(errS);
                                    goToAssignment(true)
                                        .then(function () {
                                            stringWordCount = 1;
                                            numAchieve = 0;
                                            assignmentDriver();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        });
                                })
                        } else if (divClass.includes('typeF')) {
                            console.log('ParagraphWord'.yellow);
                            answerParagraphWord()
                                .then(function () {
                                    setTimeout(function () {
                                        assignmentDriver();
                                    }, 1500);
                                })
                                .catch(function (errPara) {
                                    console.log(errPara);
                                    goToAssignment(true)
                                        .then(function () {
                                            stringWordCount = 1;
                                            numAchieve = 0;
                                            assignmentDriver();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        });
                                });
                        } else if (divClass.includes('typeI')) {
                            console.log('ImageWord'.yellow);
                            answerImageWord()
                                .then(function () {
                                    setTimeout(function () {
                                        assignmentDriver();
                                    }, 1500);
                                })
                                .catch(function (errImage) {
                                    console.log(errImage);
                                    goToAssignment(true)
                                        .then(function () {
                                            stringWordCount = 1;
                                            numAchieve = 0;
                                            assignmentDriver();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        });
                                });
                        } else if (divClass.includes('typeT')) {
                            answerAudioWord()
                                .then(function () {
                                    setTimeout(function () {
                                        assignmentDriver();
                                    }, 1500);
                                })
                                .catch(function (errWord) {
                                    console.log(errWord);
                                    goToAssignment(true)
                                        .then(function () {
                                            stringWordCount = 1;
                                            numAchieve = 0;
                                            assignmentDriver();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        });
                                });
                        } else if (divClass.includes('typeA')) {
                            answerOppositeWord()
                                .then(function () {
                                    setTimeout(function () {
                                        assignmentDriver();
                                    }, 1500);
                                })
                                .catch(function (err) {
                                    console.log(err);
                                    goToAssignment(true)
                                        .then(function () {
                                            stringWordCount = 1;
                                            numAchieve = 0;
                                            assignmentDriver();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                            goToAssignment(true)
                                                .then(function () {
                                                    stringWordCount = 1;
                                                    numAchieve = 0;
                                                    assignmentDriver();
                                                })
                                                .catch(function (err) {
                                                    console.log(err);
                                                });
                                        });
                                });
                        }
                    })
                    .catch(function (errClass) {
                        console.log(errClass);
                        goToAssignment(true)
                            .then(function () {
                                stringWordCount = 1;
                                numAchieve = 0;
                                assignmentDriver();
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                    });
            })
            .catch(function (errDiv) {
                goToAssignment(true)
                    .then(function () {
                        stringWordCount = 1;
                        numAchieve = 0;
                        assignmentDriver();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
    });
}

function answerAudioWord() {
    return new Promise(function (fufill, reject) {
        if (stringWordCount > 1) {
            var countString = '[' + stringWordCount + ']';
        } else {
            var countString = '';
        }
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[1]/div[1]')).getText()
            .then(function (prompt) {
                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div[2]/input'))
                    .then(function (inputbox) {
                        findAudioWord(prompt)
                            .then(function (data) {
                                var d = JSON.parse(data);
                                console.log(d);
                                if (d.answer != undefined) {
                                    inputbox.sendKeys(d.answer)
                                        .then(function () {
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div[3]/button[1]')).click()
                                                .then(function () {
                                                    stringWordCount++;
                                                    fufill();
                                                })
                                                .catch(function (errPress) {
                                                    console.log(errPress);
                                                    goToAssignment(true)
                                                        .then(function () {
                                                            stringWordCount = 1;
                                                            numAchieve = 0;
                                                            assignmentDriver();
                                                        })
                                                        .catch(function (err) {
                                                            console.log(err);
                                                            goToAssignment(true)
                                                                .then(function () {
                                                                    stringWordCount = 1;
                                                                    numAchieve = 0;
                                                                    assignmentDriver();
                                                                })
                                                                .catch(function (err) {
                                                                    console.log(err);
                                                                });
                                                        });
                                                });
                                        })
                                        .catch(function (errSendKeys) {
                                            console.log(errSendKeys);
                                            goToAssignment(true)
                                                .then(function () {
                                                    stringWordCount = 1;
                                                    numAchieve = 0;
                                                    assignmentDriver();
                                                })
                                                .catch(function (err) {
                                                    console.log(err);
                                                    goToAssignment(true)
                                                        .then(function () {
                                                            stringWordCount = 1;
                                                            numAchieve = 0;
                                                            assignmentDriver();
                                                        })
                                                        .catch(function (err) {
                                                            console.log(err);
                                                        });
                                                });
                                        });
                                } else {
                                    inputbox.sendKeys('test')
                                        .then(function () {
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div[3]/button[1]')).click()
                                                .then(function () {
                                                    driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div[3]/button[1]')).click()
                                                        .then(function () {
                                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div[3]/button[1]')).click()
                                                                .then(function () {
                                                                    driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div[3]/button[2]'))
                                                                        .then(function (resp) {
                                                                            driver.wait(until.elementIsVisible(resp), 5000).click()
                                                                                .then(function () {
                                                                                    driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div[3]/button[2]')).click()
                                                                                        .then(function () {
                                                                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString)).getAttribute('data-word')
                                                                                                .then(function (answer) {
                                                                                                    saveAudioWord(prompt, answer)
                                                                                                        .then(function () {
                                                                                                            stringWordCount++;
                                                                                                            fufill();
                                                                                                        })
                                                                                                        .catch(function (errSave) {
                                                                                                            console.log(errSave);
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                })
                                                                                                .catch(function (errAnswer) {
                                                                                                    console.log(errAnswer);
                                                                                                    goToAssignment(true)
                                                                                                        .then(function () {
                                                                                                            stringWordCount = 1;
                                                                                                            numAchieve = 0;
                                                                                                            assignmentDriver();
                                                                                                        })
                                                                                                        .catch(function (err) {
                                                                                                            console.log(err);
                                                                                                        });
                                                                                                });
                                                                                        })
                                                                                        .catch(function (errPress) {
                                                                                            console.log(errPress);
                                                                                            goToAssignment(true)
                                                                                                .then(function () {
                                                                                                    stringWordCount = 1;
                                                                                                    numAchieve = 0;
                                                                                                    assignmentDriver();
                                                                                                })
                                                                                                .catch(function (err) {
                                                                                                    console.log(err);
                                                                                                });
                                                                                        });
                                                                                })
                                                                                .catch(function (errPressedLast) {
                                                                                    console.log(errPressedLast);
                                                                                    goToAssignment(true)
                                                                                        .then(function () {
                                                                                            stringWordCount = 1;
                                                                                            numAchieve = 0;
                                                                                            assignmentDriver();
                                                                                        })
                                                                                        .catch(function (err) {
                                                                                            console.log(err);
                                                                                        });
                                                                                });

                                                                        })
                                                                        .catch(function (errResp) {
                                                                            console.log(errResp);
                                                                            goToAssignment(true)
                                                                                .then(function () {
                                                                                    stringWordCount = 1;
                                                                                    numAchieve = 0;
                                                                                    assignmentDriver();
                                                                                })
                                                                                .catch(function (err) {
                                                                                    console.log(err);
                                                                                });
                                                                        });

                                                                })
                                                                .catch(function (errPress3) {
                                                                    console.log(errpress3);
                                                                    goToAssignment(true)
                                                                        .then(function () {
                                                                            stringWordCount = 1;
                                                                            numAchieve = 0;
                                                                            assignmentDriver();
                                                                        })
                                                                        .catch(function (err) {
                                                                            console.log(err);
                                                                        });
                                                                });
                                                        })
                                                        .catch(function (errPress2) {
                                                            console.log(errpress2);
                                                            goToAssignment(true)
                                                                .then(function () {
                                                                    stringWordCount = 1;
                                                                    numAchieve = 0;
                                                                    assignmentDriver();
                                                                })
                                                                .catch(function (err) {
                                                                    console.log(err);
                                                                });
                                                        });
                                                })
                                                .catch(function (errPress1) {
                                                    console.log(errPress1);
                                                    goToAssignment(true)
                                                        .then(function () {
                                                            stringWordCount = 1;
                                                            numAchieve = 0;
                                                            assignmentDriver();
                                                        })
                                                        .catch(function (err) {
                                                            console.log(err);
                                                        });
                                                });
                                        })
                                        .catch(function (errSendKeys) {
                                            console.log(errSendKeys);
                                            goToAssignment(true)
                                                .then(function () {
                                                    stringWordCount = 1;
                                                    numAchieve = 0;
                                                    assignmentDriver();
                                                })
                                                .catch(function (err) {
                                                    console.log(err);
                                                });
                                        });
                                }
                            })
                            .catch(function (errData) {
                                console.log(errData);
                                goToAssignment(true)
                                    .then(function () {
                                        stringWordCount = 1;
                                        numAchieve = 0;
                                        assignmentDriver();
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                    });
                            });
                    })
                    .catch(function (errInput) {
                        console.log(errInput);
                        goToAssignment(true)
                            .then(function () {
                                stringWordCount = 1;
                                numAchieve = 0;
                                assignmentDriver();
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                    });
            })
            .catch(function (errPrompt) {
                console.log(errPrompt);
                goToAssignment(true)
                    .then(function () {
                        stringWordCount = 1;
                        numAchieve = 0;
                        assignmentDriver();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
    });
}

function findAudioWord(prompt) {
    return new Promise(function (fufill, reject) {
        const options = {
            method: 'GET',
            uri: config.api.url + '/audioWord/find',
            qs: {
                token: apiToken,
                prompt: prompt
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
}

function answerImageWord() {
    return new Promise(function (fufill, reject) {
        if (stringWordCount > 1) {
            var countString = '[' + stringWordCount + ']';
        } else {
            var countString = '';
        }
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[1]')).getAttribute('nonce')
            .then(function (a1) {
                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[2]')).getAttribute('nonce')
                    .then(function (a2) {
                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[3]')).getAttribute('nonce')
                            .then(function (a3) {
                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[4]')).getAttribute('nonce')
                                    .then(function (a4) {
                                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[3]/div')).getAttribute('innerText')
                                            .then(function (prompt) {
                                                findImageWord(prompt, a1, a2, a3, a4)
                                                    .then(function (data) {
                                                        var d = JSON.parse(data);
                                                        console.log(d);
                                                        if (d.answer != undefined) {
                                                            if (d.answer === a1) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[1]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 1!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka1) {
                                                                        console.log(clicka1);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a2) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[2]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 2!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka2) {
                                                                        console.log(clicka2);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a3) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[3]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 3!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka3) {
                                                                        console.log(clicka3);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a4) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[4]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 4!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka4) {
                                                                        console.log(clicka4);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            }
                                                        } else {
                                                            guessRandomImageWord()
                                                                .then(function (randomNumber1) {
                                                                    isCorrectMultipleChoice()
                                                                        .then(function (isCorrect1) {
                                                                            if (isCorrect1) {
                                                                                extractCorrectImageWord(randomNumber1)
                                                                                    .then(function (correctAnswer1) {
                                                                                        stringWordCount++;
                                                                                        saveImageWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer1)
                                                                                            .then(function () {
                                                                                                console.log('Saving imageWord!'.blue);

                                                                                                fufill();
                                                                                            })
                                                                                            .catch(function (errSaveStringWord1) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            });
                                                                                    })
                                                                                    .catch(function (err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            } else {
                                                                                guessRandomImageWord()
                                                                                    .then(function (randomNumber2) {
                                                                                        isCorrectMultipleChoice()
                                                                                            .then(function (isCorrect2) {
                                                                                                if (isCorrect2) {
                                                                                                    extractCorrectImageWord(randomNumber2)
                                                                                                        .then(function (correctAnswer2) {
                                                                                                            stringWordCount++;
                                                                                                            saveImageWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer2)
                                                                                                                .then(function () {
                                                                                                                    console.log('Saving imageWord!'.blue);
                                                                                                                    fufill();
                                                                                                                })
                                                                                                                .catch(function (errSaveStringWord2) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                } else {
                                                                                                    guessRandomImageWord()
                                                                                                        .then(function (randomNumber3) {
                                                                                                            isCorrectMultipleChoice()
                                                                                                                .then(function (isCorrect3) {
                                                                                                                    if (isCorrect3) {
                                                                                                                        extractCorrectImageWord(randomNumber3)
                                                                                                                            .then(function (correctAnswer3) {
                                                                                                                                stringWordCount++;
                                                                                                                                saveImageWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer3)
                                                                                                                                    .then(function () {
                                                                                                                                        console.log('Saving imageWord!'.blue);
                                                                                                                                        fufill();
                                                                                                                                    })
                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    });
                                                                                                                            })
                                                                                                                    } else {
                                                                                                                        guessRandomImageWord()
                                                                                                                            .then(function (randomNumber4) {
                                                                                                                                isCorrectMultipleChoice()
                                                                                                                                    .then(function (isCorrect4) {
                                                                                                                                        extractCorrectImageWord(randomNumber4)
                                                                                                                                            .then(function (correctAnswer4) {
                                                                                                                                                stringWordCount++;
                                                                                                                                                saveImageWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer4)
                                                                                                                                                    .then(function () {
                                                                                                                                                        console.log('Saving imageWord!'.blue);
                                                                                                                                                        fufill();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                                        goToAssignment(true)
                                                                                                                                                            .then(function () {
                                                                                                                                                                stringWordCount = 1;
                                                                                                                                                                numAchieve = 0;
                                                                                                                                                                assignmentDriver();
                                                                                                                                                            })
                                                                                                                                                            .catch(function (err) {
                                                                                                                                                                console.log(err);
                                                                                                                                                            });
                                                                                                                                                    });
                                                                                                                                            })
                                                                                                                                            .catch(function (correctAnswer4Err) {
                                                                                                                                                goToAssignment(true)
                                                                                                                                                    .then(function () {
                                                                                                                                                        stringWordCount = 1;
                                                                                                                                                        numAchieve = 0;
                                                                                                                                                        assignmentDriver();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (err) {
                                                                                                                                                        console.log(err);
                                                                                                                                                    });
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                                    .catch(function (isCorrect4Err) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                            })
                                                                                                                            .catch(function (randomNumber4Err) {
                                                                                                                                goToAssignment(true)
                                                                                                                                    .then(function () {
                                                                                                                                        stringWordCount = 1;
                                                                                                                                        numAchieve = 0;
                                                                                                                                        assignmentDriver();
                                                                                                                                    })
                                                                                                                                    .catch(function (err) {
                                                                                                                                        console.log(err);
                                                                                                                                    });
                                                                                                                            });
                                                                                                                    }
                                                                                                                })
                                                                                                                .catch(function (isCorrect3Err) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (randomNumber3Err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                }
                                                                                            })
                                                                                            .catch(function (isCorrect2Err) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            })
                                                                                    })
                                                                                    .catch(function (randomNumber2Err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            }
                                                                        })
                                                                        .catch(function (isCorrect1Err) {
                                                                            goToAssignment(true)
                                                                                .then(function () {
                                                                                    stringWordCount = 1;
                                                                                    numAchieve = 0;
                                                                                    assignmentDriver();
                                                                                })
                                                                                .catch(function (err) {
                                                                                    console.log(err);
                                                                                });
                                                                        })
                                                                })
                                                                .catch(function (randomNumber1Err) {
                                                                    goToAssignment(true)
                                                                        .then(function () {
                                                                            stringWordCount = 1;
                                                                            numAchieve = 0;
                                                                            assignmentDriver();
                                                                        })
                                                                        .catch(function (err) {
                                                                            console.log(err);
                                                                        });
                                                                });
                                                        }
                                                    })
                                                    .catch(function (errImageWord) {
                                                        goToAssignment(true)
                                                            .then(function () {
                                                                stringWordCount = 1;
                                                                numAchieve = 0;
                                                                assignmentDriver();
                                                            })
                                                            .catch(function (err) {
                                                                console.log(err);
                                                            });
                                                    });
                                            })
                                            .catch(function (imageErr4) {
                                                goToAssignment(true)
                                                    .then(function () {
                                                        stringWordCount = 1;
                                                        numAchieve = 0;
                                                        assignmentDriver();
                                                    })
                                                    .catch(function (err) {
                                                        console.log(err);
                                                    });
                                            });
                                    })
                                    .catch(function (imageErr3) {
                                        goToAssignment(true)
                                            .then(function () {
                                                stringWordCount = 1;
                                                numAchieve = 0;
                                                assignmentDriver();
                                            })
                                            .catch(function (err) {
                                                console.log(err);
                                            });
                                    });
                            })
                            .catch(function (imageErr2) {
                                goToAssignment(true)
                                    .then(function () {
                                        stringWordCount = 1;
                                        numAchieve = 0;
                                        assignmentDriver();
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                    });
                            });
                    })
                    .catch(function (imageErr1) {
                        goToAssignment(true)
                            .then(function () {
                                stringWordCount = 1;
                                numAchieve = 0;
                                assignmentDriver();
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                    });
            })
            .catch(function (errPrompt) {
                goToAssignment(true)
                    .then(function () {
                        stringWordCount = 1;
                        numAchieve = 0;
                        assignmentDriver();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            })

    });
}

function answerParagraphWord() {
    return new Promise(function (fufill, reject) {
        if (stringWordCount > 1) {
            var countString = '[' + stringWordCount + ']';
        } else {
            var countString = '';
        }
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).getText()
            .then(function (a1) {
                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).getText()
                    .then(function (a2) {
                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).getText()
                            .then(function (a3) {
                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).getText()
                                    .then(function (a4) {
                                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div')).getText()
                                            .then(function (prompt) {
                                                findParagraphWord(prompt, a1, a2, a3, a4)
                                                    .then(function (data) {
                                                        var d = JSON.parse(data);
                                                        console.log(d);
                                                        if (d.answer != undefined) {
                                                            if (d.answer === a1) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 1!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka1) {
                                                                        console.log(clicka1);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a2) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 2!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka2) {
                                                                        console.log(clicka2);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a3) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 3!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka3) {
                                                                        console.log(clicka3);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a4) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 4!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka4) {
                                                                        console.log(clicka4);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            }
                                                        } else {
                                                            console.log('About to guess a random paragraphWord');
                                                            guessRandomStringWord()
                                                                .then(function (randomNumber1) {
                                                                    isCorrectMultipleChoice()
                                                                        .then(function (isCorrect1) {
                                                                            if (isCorrect1) {
                                                                                extractCorrectParagraphWord(randomNumber1)
                                                                                    .then(function (correctAnswer1) {
                                                                                        stringWordCount++;
                                                                                        saveParagraphWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer1)
                                                                                            .then(function () {
                                                                                                console.log('Saving paragraphWord!'.blue);

                                                                                                fufill();
                                                                                            })
                                                                                            .catch(function (errSaveStringWord1) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            });
                                                                                    })
                                                                                    .catch(function (err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            } else {
                                                                                guessRandomStringWord()
                                                                                    .then(function (randomNumber2) {
                                                                                        isCorrectMultipleChoice()
                                                                                            .then(function (isCorrect2) {
                                                                                                if (isCorrect2) {
                                                                                                    extractCorrectParagraphWord(randomNumber2)
                                                                                                        .then(function (correctAnswer2) {
                                                                                                            stringWordCount++;
                                                                                                            saveParagraphWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer2)
                                                                                                                .then(function () {
                                                                                                                    console.log('Saving paragraphWord!'.blue);
                                                                                                                    fufill();
                                                                                                                })
                                                                                                                .catch(function (errSaveStringWord2) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                } else {
                                                                                                    guessRandomStringWord()
                                                                                                        .then(function (randomNumber3) {
                                                                                                            isCorrectMultipleChoice()
                                                                                                                .then(function (isCorrect3) {
                                                                                                                    if (isCorrect3) {
                                                                                                                        extractCorrectParagraphWord(randomNumber3)
                                                                                                                            .then(function (correctAnswer3) {
                                                                                                                                stringWordCount++;
                                                                                                                                saveParagraphWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer3)
                                                                                                                                    .then(function () {
                                                                                                                                        console.log('Saving paragraphWord!'.blue);
                                                                                                                                        fufill();
                                                                                                                                    })
                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    });
                                                                                                                            })
                                                                                                                    } else {
                                                                                                                        guessRandomStringWord()
                                                                                                                            .then(function (randomNumber4) {
                                                                                                                                isCorrectMultipleChoice()
                                                                                                                                    .then(function (isCorrect4) {
                                                                                                                                        extractCorrectParagraphWord(randomNumber4)
                                                                                                                                            .then(function (correctAnswer4) {
                                                                                                                                                stringWordCount++;
                                                                                                                                                saveParagraphWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer4)
                                                                                                                                                    .then(function () {
                                                                                                                                                        console.log('Saving paragraphWord!'.blue);
                                                                                                                                                        fufill();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                                        goToAssignment(true)
                                                                                                                                                            .then(function () {
                                                                                                                                                                stringWordCount = 1;
                                                                                                                                                                numAchieve = 0;
                                                                                                                                                                assignmentDriver();
                                                                                                                                                            })
                                                                                                                                                            .catch(function (err) {
                                                                                                                                                                console.log(err);
                                                                                                                                                            });
                                                                                                                                                    });
                                                                                                                                            })
                                                                                                                                            .catch(function (correctAnswer4Err) {
                                                                                                                                                goToAssignment(true)
                                                                                                                                                    .then(function () {
                                                                                                                                                        stringWordCount = 1;
                                                                                                                                                        numAchieve = 0;
                                                                                                                                                        assignmentDriver();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (err) {
                                                                                                                                                        console.log(err);
                                                                                                                                                    });
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                                    .catch(function (isCorrect4Err) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                            })
                                                                                                                            .catch(function (randomNumber4Err) {
                                                                                                                                goToAssignment(true)
                                                                                                                                    .then(function () {
                                                                                                                                        stringWordCount = 1;
                                                                                                                                        numAchieve = 0;
                                                                                                                                        assignmentDriver();
                                                                                                                                    })
                                                                                                                                    .catch(function (err) {
                                                                                                                                        console.log(err);
                                                                                                                                    });
                                                                                                                            });
                                                                                                                    }
                                                                                                                })
                                                                                                                .catch(function (isCorrect3Err) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (randomNumber3Err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                }
                                                                                            })
                                                                                            .catch(function (isCorrect2Err) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            })
                                                                                    })
                                                                                    .catch(function (randomNumber2Err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            }
                                                                        })
                                                                        .catch(function (isCorrect1Err) {
                                                                            goToAssignment(true)
                                                                                .then(function () {
                                                                                    stringWordCount = 1;
                                                                                    numAchieve = 0;
                                                                                    assignmentDriver();
                                                                                })
                                                                                .catch(function (err) {
                                                                                    console.log(err);
                                                                                });
                                                                        })
                                                                })
                                                                .catch(function (randomNumber1Err) {
                                                                    goToAssignment(true)
                                                                        .then(function () {
                                                                            stringWordCount = 1;
                                                                            numAchieve = 0;
                                                                            assignmentDriver();
                                                                        })
                                                                        .catch(function (err) {
                                                                            console.log(err);
                                                                        });
                                                                });
                                                        }
                                                    })
                                                    .catch(function (errData) {
                                                        goToAssignment(true)
                                                            .then(function () {
                                                                stringWordCount = 1;
                                                                numAchieve = 0;
                                                                assignmentDriver();
                                                            })
                                                            .catch(function (err) {
                                                                console.log(err);
                                                            });
                                                    });
                                            })
                                            .catch(function (errPrompt) {
                                                goToAssignment(true)
                                                    .then(function () {
                                                        stringWordCount = 1;
                                                        numAchieve = 0;
                                                        assignmentDriver();
                                                    })
                                                    .catch(function (err) {
                                                        console.log(err);
                                                    });
                                            });
                                    })
                                    .catch(function (errA4) {
                                        goToAssignment(true)
                                            .then(function () {
                                                stringWordCount = 1;
                                                numAchieve = 0;
                                                assignmentDriver();
                                            })
                                            .catch(function (err) {
                                                console.log(err);
                                            });
                                    });
                            })
                            .catch(function (errA3) {
                                goToAssignment(true)
                                    .then(function () {
                                        stringWordCount = 1;
                                        numAchieve = 0;
                                        assignmentDriver();
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                    });
                            });
                    })
                    .catch(function (errA2) {
                        goToAssignment(true)
                            .then(function () {
                                stringWordCount = 1;
                                numAchieve = 0;
                                assignmentDriver();
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                    });
            })
            .catch(function (errA1) {
                goToAssignment(true)
                    .then(function () {
                        stringWordCount = 1;
                        numAchieve = 0;
                        assignmentDriver();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
    });
}

function answerStringWord() {
    return new Promise(function (fufill, reject) {
        if (stringWordCount > 1) {
            var countString = '[' + stringWordCount + ']';
        } else {
            var countString = '';
        }
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).getText()
            .then(function (a1) {
                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[3]')).getText()
                    .then(function (prompt) {
                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).getText()
                            .then(function (a2) {
                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).getText()
                                    .then(function (a3) {
                                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).getText()
                                            .then(function (a4) {
                                                //try to pull data from the prompt, if not found, guess and save the correct answer
                                                findStringWord(prompt, a1, a2, a3, a4)
                                                    .then(function (data) {
                                                        var d = JSON.parse(data);
                                                        console.log(d);
                                                        if (d.answer != undefined) {
                                                            //TODO: check if its correct
                                                            if (d.answer === a1) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 1!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka1) {
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a2) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 2!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka2) {
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a3) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 3!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka3) {
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a4) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 4!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka4) {
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            }
                                                        } else {
                                                            guessRandomStringWord()
                                                                .then(function (randomNumber1) {
                                                                    isCorrectMultipleChoice()
                                                                        .then(function (isCorrect1) {
                                                                            if (isCorrect1) {
                                                                                extractCorrectStringWord(randomNumber1)
                                                                                    .then(function (correctAnswer1) {
                                                                                        stringWordCount++;
                                                                                        saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer1)
                                                                                            .then(function () {
                                                                                                console.log('Saving stringWord!'.blue);

                                                                                                fufill();
                                                                                            })
                                                                                            .catch(function (errSaveStringWord1) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            });
                                                                                    })
                                                                                    .catch(function (err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            } else {
                                                                                guessRandomStringWord()
                                                                                    .then(function (randomNumber2) {
                                                                                        isCorrectMultipleChoice()
                                                                                            .then(function (isCorrect2) {
                                                                                                if (isCorrect2) {
                                                                                                    extractCorrectStringWord(randomNumber2)
                                                                                                        .then(function (correctAnswer2) {
                                                                                                            stringWordCount++;
                                                                                                            saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer2)
                                                                                                                .then(function () {
                                                                                                                    console.log('Saving stringWord!'.blue);
                                                                                                                    fufill();
                                                                                                                })
                                                                                                                .catch(function (errSaveStringWord2) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                } else {
                                                                                                    guessRandomStringWord()
                                                                                                        .then(function (randomNumber3) {
                                                                                                            isCorrectMultipleChoice()
                                                                                                                .then(function (isCorrect3) {
                                                                                                                    if (isCorrect3) {
                                                                                                                        extractCorrectStringWord(randomNumber3)
                                                                                                                            .then(function (correctAnswer3) {
                                                                                                                                stringWordCount++;
                                                                                                                                saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer3)
                                                                                                                                    .then(function () {
                                                                                                                                        console.log('Saving stringWord!'.blue);
                                                                                                                                        fufill();
                                                                                                                                    })
                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    });
                                                                                                                            })
                                                                                                                    } else {
                                                                                                                        guessRandomStringWord()
                                                                                                                            .then(function (randomNumber4) {
                                                                                                                                isCorrectMultipleChoice()
                                                                                                                                    .then(function (isCorrect4) {
                                                                                                                                        extractCorrectStringWord(randomNumber4)
                                                                                                                                            .then(function (correctAnswer4) {
                                                                                                                                                stringWordCount++;
                                                                                                                                                console.log('Preparing to save!'.blue);
                                                                                                                                                saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer4)
                                                                                                                                                    .then(function () {
                                                                                                                                                        console.log('Saving stringWord!'.blue);
                                                                                                                                                        fufill();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                                        goToAssignment(true)
                                                                                                                                                            .then(function () {
                                                                                                                                                                stringWordCount = 1;
                                                                                                                                                                numAchieve = 0;
                                                                                                                                                                assignmentDriver();
                                                                                                                                                            })
                                                                                                                                                            .catch(function (err) {
                                                                                                                                                                console.log(err);
                                                                                                                                                            });
                                                                                                                                                    });
                                                                                                                                            })
                                                                                                                                            .catch(function (correctAnswer4Err) {
                                                                                                                                                goToAssignment(true)
                                                                                                                                                    .then(function () {
                                                                                                                                                        stringWordCount = 1;
                                                                                                                                                        numAchieve = 0;
                                                                                                                                                        assignmentDriver();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (err) {
                                                                                                                                                        console.log(err);
                                                                                                                                                    });
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                                    .catch(function (isCorrect4Err) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                            })
                                                                                                                            .catch(function (randomNumber4Err) {
                                                                                                                                goToAssignment(true)
                                                                                                                                    .then(function () {
                                                                                                                                        stringWordCount = 1;
                                                                                                                                        numAchieve = 0;
                                                                                                                                        assignmentDriver();
                                                                                                                                    })
                                                                                                                                    .catch(function (err) {
                                                                                                                                        console.log(err);
                                                                                                                                    });
                                                                                                                            });
                                                                                                                    }
                                                                                                                })
                                                                                                                .catch(function (isCorrect3Err) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (randomNumber3Err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                }
                                                                                            })
                                                                                            .catch(function (isCorrect2Err) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            })
                                                                                    })
                                                                                    .catch(function (randomNumber2Err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            }
                                                                        })
                                                                        .catch(function (isCorrect1Err) {
                                                                            goToAssignment(true)
                                                                                .then(function () {
                                                                                    stringWordCount = 1;
                                                                                    numAchieve = 0;
                                                                                    assignmentDriver();
                                                                                })
                                                                                .catch(function (err) {
                                                                                    console.log(err);
                                                                                });
                                                                        })
                                                                })
                                                                .catch(function (randomNumber1Err) {
                                                                    goToAssignment(true)
                                                                        .then(function () {
                                                                            stringWordCount = 1;
                                                                            numAchieve = 0;
                                                                            assignmentDriver();
                                                                        })
                                                                        .catch(function (err) {
                                                                            console.log(err);
                                                                        });
                                                                });
                                                        }
                                                    })
                                                    .catch(function (findSWErr) {
                                                        goToAssignment(true)
                                                            .then(function () {
                                                                stringWordCount = 1;
                                                                numAchieve = 0;
                                                                assignmentDriver();
                                                            })
                                                            .catch(function (err) {
                                                                console.log(err);
                                                            });
                                                    });
                                            })
                                            .catch(function (erra4) {
                                                goToAssignment(true)
                                                    .then(function () {
                                                        stringWordCount = 1;
                                                        numAchieve = 0;
                                                        assignmentDriver();
                                                    })
                                                    .catch(function (err) {
                                                        console.log(err);
                                                    });
                                            });
                                    })
                                    .catch(function (erra3) {
                                        goToAssignment(true)
                                            .then(function () {
                                                stringWordCount = 1;
                                                numAchieve = 0;
                                                assignmentDriver();
                                            })
                                            .catch(function (err) {
                                                console.log(err);
                                            });
                                    });
                            })
                            .catch(function (erra2) {
                                goToAssignment(true)
                                    .then(function () {
                                        stringWordCount = 1;
                                        numAchieve = 0;
                                        assignmentDriver();
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                    });
                            });
                    })
                    .catch(function (errPrompt) {
                        goToAssignment(true)
                            .then(function () {
                                stringWordCount = 1;
                                numAchieve = 0;
                                assignmentDriver();
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                    });
            })
            .catch(function (erra1) {
                goToAssignment(true)
                    .then(function () {
                        stringWordCount = 1;
                        numAchieve = 0;
                        assignmentDriver();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
    });
}

function answerSentenceWord() {
    return new Promise(function (fufill, reject) {
        if (stringWordCount > 1) {
            var countString = '[' + stringWordCount + ']';
        } else {
            var countString = '';
        }
        //*[@id="challenge"]/div/div[1]/div[4]/div/div/section[1]/div[1]/div[4]/a[1]
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).getText()
            .then(function (a1) {
                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/div')).getText()
                    .then(function (prompt) {
                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).getText()
                            .then(function (a2) {
                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).getText()
                                    .then(function (a3) {
                                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).getText()
                                            .then(function (a4) {
                                                //try to pull data from the prompt, if not found, guess and save the correct answer
                                                findSentenceWord(prompt, a1, a2, a3, a4)
                                                    .then(function (data) {
                                                        var d = JSON.parse(data);
                                                        console.log(d);
                                                        if (d.answer != undefined) {
                                                            //TODO: check if its correct
                                                            if (d.answer === a1) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 1!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka1) {
                                                                        console.log(clicka1);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a2) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 2!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka2) {
                                                                        console.log(clicka2);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a3) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 3!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka3) {
                                                                        console.log(clicka3);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a4) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 4!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka4) {
                                                                        console.log(clicka4);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            }
                                                        } else {
                                                            guessRandomStringWord()
                                                                .then(function (randomNumber1) {
                                                                    isCorrectMultipleChoice()
                                                                        .then(function (isCorrect1) {
                                                                            if (isCorrect1) {
                                                                                extractCorrectSentenceWord(randomNumber1)
                                                                                    .then(function (correctAnswer1) {
                                                                                        stringWordCount++;
                                                                                        saveSentenceWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer1)
                                                                                            .then(function () {
                                                                                                console.log('Saving sentenceWord!'.blue);

                                                                                                fufill();
                                                                                            })
                                                                                            .catch(function (errSaveStringWord1) {
                                                                                                console.log(errSaveStringWord1);
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            });
                                                                                    })
                                                                                    .catch(function (err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            } else {
                                                                                guessRandomStringWord()
                                                                                    .then(function (randomNumber2) {
                                                                                        isCorrectMultipleChoice()
                                                                                            .then(function (isCorrect2) {
                                                                                                if (isCorrect2) {
                                                                                                    extractCorrectSentenceWord(randomNumber2)
                                                                                                        .then(function (correctAnswer2) {
                                                                                                            stringWordCount++;
                                                                                                            saveSentenceWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer2)
                                                                                                                .then(function () {
                                                                                                                    console.log('Saving sentenceWord!'.blue);
                                                                                                                    fufill();
                                                                                                                })
                                                                                                                .catch(function (errSaveStringWord2) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                } else {
                                                                                                    guessRandomStringWord()
                                                                                                        .then(function (randomNumber3) {
                                                                                                            isCorrectMultipleChoice()
                                                                                                                .then(function (isCorrect3) {
                                                                                                                    if (isCorrect3) {
                                                                                                                        extractCorrectSentenceWord(randomNumber3)
                                                                                                                            .then(function (correctAnswer3) {
                                                                                                                                stringWordCount++;
                                                                                                                                saveSentenceWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer3)
                                                                                                                                    .then(function () {
                                                                                                                                        console.log('Saving sentenceWord!'.blue);
                                                                                                                                        fufill();
                                                                                                                                    })
                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    });
                                                                                                                            })
                                                                                                                    } else {
                                                                                                                        guessRandomStringWord()
                                                                                                                            .then(function (randomNumber4) {
                                                                                                                                isCorrectMultipleChoice()
                                                                                                                                    .then(function (isCorrect4) {
                                                                                                                                        extractCorrectSentenceWord(randomNumber4)
                                                                                                                                            .then(function (correctAnswer4) {
                                                                                                                                                stringWordCount++;
                                                                                                                                                saveSentenceWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer4)
                                                                                                                                                    .then(function () {
                                                                                                                                                        console.log('Saving sentenceWord!'.blue);
                                                                                                                                                        fufill();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                                        goToAssignment(true)
                                                                                                                                                            .then(function () {
                                                                                                                                                                stringWordCount = 1;
                                                                                                                                                                numAchieve = 0;
                                                                                                                                                                assignmentDriver();
                                                                                                                                                            })
                                                                                                                                                            .catch(function (err) {
                                                                                                                                                                console.log(err);
                                                                                                                                                            });
                                                                                                                                                    });
                                                                                                                                            })
                                                                                                                                            .catch(function (correctAnswer4Err) {
                                                                                                                                                goToAssignment(true)
                                                                                                                                                    .then(function () {
                                                                                                                                                        stringWordCount = 1;
                                                                                                                                                        numAchieve = 0;
                                                                                                                                                        assignmentDriver();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (err) {
                                                                                                                                                        console.log(err);
                                                                                                                                                    });
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                                    .catch(function (isCorrect4Err) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                            })
                                                                                                                            .catch(function (randomNumber4Err) {
                                                                                                                                goToAssignment(true)
                                                                                                                                    .then(function () {
                                                                                                                                        stringWordCount = 1;
                                                                                                                                        numAchieve = 0;
                                                                                                                                        assignmentDriver();
                                                                                                                                    })
                                                                                                                                    .catch(function (err) {
                                                                                                                                        console.log(err);
                                                                                                                                    });
                                                                                                                            });
                                                                                                                    }
                                                                                                                })
                                                                                                                .catch(function (isCorrect3Err) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (randomNumber3Err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                }
                                                                                            })
                                                                                            .catch(function (isCorrect2Err) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            })
                                                                                    })
                                                                                    .catch(function (randomNumber2Err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });;
                                                                                    });
                                                                            }
                                                                        })
                                                                        .catch(function (isCorrect1Err) {
                                                                            goToAssignment(true)
                                                                                .then(function () {
                                                                                    stringWordCount = 1;
                                                                                    numAchieve = 0;
                                                                                    assignmentDriver();
                                                                                })
                                                                                .catch(function (err) {
                                                                                    console.log(err);
                                                                                });
                                                                        })
                                                                })
                                                                .catch(function (randomNumber1Err) {
                                                                    goToAssignment(true)
                                                                        .then(function () {
                                                                            stringWordCount = 1;
                                                                            numAchieve = 0;
                                                                            assignmentDriver();
                                                                        })
                                                                        .catch(function (err) {
                                                                            console.log(err);
                                                                        });
                                                                });
                                                        }
                                                    })
                                                    .catch(function (findSWErr) {
                                                        goToAssignment(true)
                                                            .then(function () {
                                                                stringWordCount = 1;
                                                                numAchieve = 0;
                                                                assignmentDriver();
                                                            })
                                                            .catch(function (err) {
                                                                console.log(err);
                                                            });
                                                    });
                                            })
                                            .catch(function (erra4) {
                                                goToAssignment(true)
                                                    .then(function () {
                                                        stringWordCount = 1;
                                                        numAchieve = 0;
                                                        assignmentDriver();
                                                    })
                                                    .catch(function (err) {
                                                        console.log(err);
                                                    });
                                            });
                                    })
                                    .catch(function (erra3) {
                                        goToAssignment(true)
                                            .then(function () {
                                                stringWordCount = 1;
                                                numAchieve = 0;
                                                assignmentDriver();
                                            })
                                            .catch(function (err) {
                                                console.log(err);
                                            });
                                    });
                            })
                            .catch(function (erra2) {
                                goToAssignment(true)
                                    .then(function () {
                                        stringWordCount = 1;
                                        numAchieve = 0;
                                        assignmentDriver();
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                    });
                            });
                    })
                    .catch(function (errPrompt) {
                        goToAssignment(true)
                            .then(function () {
                                stringWordCount = 1;
                                numAchieve = 0;
                                assignmentDriver();
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                    });
            })
            .catch(function (erra1) {
                goToAssignment(true)
                    .then(function () {
                        stringWordCount = 1;
                        numAchieve = 0;
                        assignmentDriver();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
    });
}

function isMovable(callback) {
    setTimeout(function () {
        console.log('Checking if is able to be moved!'.blue);
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[2]/button'))
            .then(function (arrClass) {
                arrClass.getAttribute('class')
                    .then(function (arrowClass) {
                        if (arrowClass.includes('active')) {
                            console.log('Checking for active class!'.blue);
                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[2]/button')).click()
                                .then(function () {
                                    console.log('Looping movement again!'.blue)
                                    setTimeout(function () {
                                        isMovable(callback);
                                    }, 2000);
                                })
                                .catch(function (errClick) {
                                    console.log(errClick + ''.red);
                                });
                        } else {
                            setTimeout(callback, 1000);
                        }
                    })
                    .catch(function (moveErr) {
                        console.log(moveErr + '.blue');
                    })
            })
            .catch(function (error) {
                console.log('Not found! Must mean there is nothing left to click!'.blue);
                callback();
            });
    }, 250);
}

function answerOppositeWord() {
    return new Promise(function (fufill, reject) {
        if (stringWordCount > 1) {
            var countString = '[' + stringWordCount + ']';
        } else {
            var countString = '';
        }

        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[3]/strong')).getText()
            .then(function (prompt) {
                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).getText()
                    .then(function (a1) {
                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).getText()
                            .then(function (a2) {
                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).getText()
                                    .then(function (a3) {
                                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).getText()
                                            .then(function (a4) {
                                                findOppositeWord(prompt, a1, a2, a3, a4)
                                                    .then(function (data) {
                                                        var d = JSON.parse(data);
                                                        console.log(d);
                                                        if (d.answer != undefined) {
                                                            if (d.answer === a1) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 1!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka1) {
                                                                        console.log(clicka1);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });

                                                            } else if (d.answer === a2) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 2!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka2) {
                                                                        console.log(clicka2);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a3) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 3!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka3) {
                                                                        console.log(clicka3);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            } else if (d.answer === a4) {
                                                                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).click()
                                                                    .then(function () {
                                                                        console.log('Clicked answer 4!'.blue);
                                                                        stringWordCount++;
                                                                        fufill();
                                                                    })
                                                                    .catch(function (clicka4) {
                                                                        console.log(clicka4);
                                                                        goToAssignment(true)
                                                                            .then(function () {
                                                                                stringWordCount = 1;
                                                                                numAchieve = 0;
                                                                                assignmentDriver();
                                                                            })
                                                                            .catch(function (err) {
                                                                                console.log(err);
                                                                            });
                                                                    });
                                                            }
                                                        } else {
                                                            guessRandomOppositeWord()
                                                                .then(function (randomNumber1) {
                                                                    isCorrectMultipleChoice()
                                                                        .then(function (isCorrect1) {
                                                                            if (isCorrect1) {
                                                                                extractCorrectOppositeWord(randomNumber1)
                                                                                    .then(function (correctAnswer1) {
                                                                                        stringWordCount++;
                                                                                        saveOppositeWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer1)
                                                                                            .then(function () {
                                                                                                console.log('Saving sentenceWord!'.blue);
                                                                                                fufill();
                                                                                            })
                                                                                            .catch(function (errSaveStringWord1) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            });
                                                                                    })
                                                                                    .catch(function (err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            } else {
                                                                                guessRandomOppositeWord()
                                                                                    .then(function (randomNumber2) {
                                                                                        isCorrectMultipleChoice()
                                                                                            .then(function (isCorrect2) {
                                                                                                if (isCorrect2) {
                                                                                                    extractCorrectOppositeWord(randomNumber2)
                                                                                                        .then(function (correctAnswer2) {
                                                                                                            stringWordCount++;
                                                                                                            saveOppositeWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer2)
                                                                                                                .then(function () {
                                                                                                                    console.log('Saving sentenceWord!'.blue);
                                                                                                                    fufill();
                                                                                                                })
                                                                                                                .catch(function (errSaveStringWord2) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                } else {
                                                                                                    guessRandomOppositeWord()
                                                                                                        .then(function (randomNumber3) {
                                                                                                            isCorrectMultipleChoice()
                                                                                                                .then(function (isCorrect3) {
                                                                                                                    if (isCorrect3) {
                                                                                                                        extractCorrectOppositeWord(randomNumber3)
                                                                                                                            .then(function (correctAnswer3) {
                                                                                                                                stringWordCount++;
                                                                                                                                saveOppositeWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer3)
                                                                                                                                    .then(function () {
                                                                                                                                        console.log('Saving sentenceWord!'.blue);
                                                                                                                                        fufill();
                                                                                                                                    })
                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    });
                                                                                                                            })
                                                                                                                    } else {
                                                                                                                        guessRandomOppositeWord()
                                                                                                                            .then(function (randomNumber4) {
                                                                                                                                isCorrectMultipleChoice()
                                                                                                                                    .then(function (isCorrect4) {
                                                                                                                                        extractCorrectOppositeWord(randomNumber4)
                                                                                                                                            .then(function (correctAnswer4) {
                                                                                                                                                stringWordCount++;
                                                                                                                                                saveOppositeWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer4)
                                                                                                                                                    .then(function () {
                                                                                                                                                        console.log('Saving sentenceWord!'.blue);
                                                                                                                                                        fufill();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (errSaveStringWord2) {
                                                                                                                                                        goToAssignment(true)
                                                                                                                                                            .then(function () {
                                                                                                                                                                stringWordCount = 1;
                                                                                                                                                                numAchieve = 0;
                                                                                                                                                                assignmentDriver();
                                                                                                                                                            })
                                                                                                                                                            .catch(function (err) {
                                                                                                                                                                console.log(err);
                                                                                                                                                            });
                                                                                                                                                    });
                                                                                                                                            })
                                                                                                                                            .catch(function (correctAnswer4Err) {
                                                                                                                                                goToAssignment(true)
                                                                                                                                                    .then(function () {
                                                                                                                                                        stringWordCount = 1;
                                                                                                                                                        numAchieve = 0;
                                                                                                                                                        assignmentDriver();
                                                                                                                                                    })
                                                                                                                                                    .catch(function (err) {
                                                                                                                                                        console.log(err);
                                                                                                                                                    });
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                                    .catch(function (isCorrect4Err) {
                                                                                                                                        goToAssignment(true)
                                                                                                                                            .then(function () {
                                                                                                                                                stringWordCount = 1;
                                                                                                                                                numAchieve = 0;
                                                                                                                                                assignmentDriver();
                                                                                                                                            })
                                                                                                                                            .catch(function (err) {
                                                                                                                                                console.log(err);
                                                                                                                                            });
                                                                                                                                    })
                                                                                                                            })
                                                                                                                            .catch(function (randomNumber4Err) {
                                                                                                                                goToAssignment(true)
                                                                                                                                    .then(function () {
                                                                                                                                        stringWordCount = 1;
                                                                                                                                        numAchieve = 0;
                                                                                                                                        assignmentDriver();
                                                                                                                                    })
                                                                                                                                    .catch(function (err) {
                                                                                                                                        console.log(err);
                                                                                                                                    });
                                                                                                                            });
                                                                                                                    }
                                                                                                                })
                                                                                                                .catch(function (isCorrect3Err) {
                                                                                                                    goToAssignment(true)
                                                                                                                        .then(function () {
                                                                                                                            stringWordCount = 1;
                                                                                                                            numAchieve = 0;
                                                                                                                            assignmentDriver();
                                                                                                                        })
                                                                                                                        .catch(function (err) {
                                                                                                                            console.log(err);
                                                                                                                        });
                                                                                                                });
                                                                                                        })
                                                                                                        .catch(function (randomNumber3Err) {
                                                                                                            goToAssignment(true)
                                                                                                                .then(function () {
                                                                                                                    stringWordCount = 1;
                                                                                                                    numAchieve = 0;
                                                                                                                    assignmentDriver();
                                                                                                                })
                                                                                                                .catch(function (err) {
                                                                                                                    console.log(err);
                                                                                                                });
                                                                                                        });
                                                                                                }
                                                                                            })
                                                                                            .catch(function (isCorrect2Err) {
                                                                                                goToAssignment(true)
                                                                                                    .then(function () {
                                                                                                        stringWordCount = 1;
                                                                                                        numAchieve = 0;
                                                                                                        assignmentDriver();
                                                                                                    })
                                                                                                    .catch(function (err) {
                                                                                                        console.log(err);
                                                                                                    });
                                                                                            })
                                                                                    })
                                                                                    .catch(function (randomNumber2Err) {
                                                                                        goToAssignment(true)
                                                                                            .then(function () {
                                                                                                stringWordCount = 1;
                                                                                                numAchieve = 0;
                                                                                                assignmentDriver();
                                                                                            })
                                                                                            .catch(function (err) {
                                                                                                console.log(err);
                                                                                            });
                                                                                    });
                                                                            }
                                                                        })
                                                                        .catch(function (isCorrect1Err) {
                                                                            goToAssignment(true)
                                                                                .then(function () {
                                                                                    stringWordCount = 1;
                                                                                    numAchieve = 0;
                                                                                    assignmentDriver();
                                                                                })
                                                                                .catch(function (err) {
                                                                                    console.log(err);
                                                                                });
                                                                        })
                                                                })
                                                                .catch(function (randomNumber1Err) {
                                                                    goToAssignment(true)
                                                                        .then(function () {
                                                                            stringWordCount = 1;
                                                                            numAchieve = 0;
                                                                            assignmentDriver();
                                                                        })
                                                                        .catch(function (err) {
                                                                            console.log(err);
                                                                        });
                                                                });
                                                        }
                                                    })
                                                    .catch(function (err5) {
                                                        goToAssignment(true)
                                                            .then(function () {
                                                                stringWordCount = 1;
                                                                numAchieve = 0;
                                                                assignmentDriver();
                                                            })
                                                            .catch(function (err) {
                                                                console.log(err);
                                                            });
                                                    });
                                            })
                                            .catch(function (err4) {
                                                goToAssignment(true)
                                                    .then(function () {
                                                        stringWordCount = 1;
                                                        numAchieve = 0;
                                                        assignmentDriver();
                                                    })
                                                    .catch(function (err) {
                                                        console.log(err);
                                                    });
                                            });
                                    })
                                    .catch(function (err3) {
                                        goToAssignment(true)
                                            .then(function () {
                                                stringWordCount = 1;
                                                numAchieve = 0;
                                                assignmentDriver();
                                            })
                                            .catch(function (err) {
                                                console.log(err);
                                            });
                                    });
                            })
                            .catch(function (err2) {
                                goToAssignment(true)
                                    .then(function () {
                                        stringWordCount = 1;
                                        numAchieve = 0;
                                        assignmentDriver();
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                    });
                            });
                    })
                    .catch(function (err1) {
                        goToAssignment(true)
                            .then(function () {
                                stringWordCount = 1;
                                numAchieve = 0;
                                assignmentDriver();
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                    });
            })
            .catch(function (err) {
                goToAssignment(true)
                    .then(function () {
                        stringWordCount = 1;
                        numAchieve = 0;
                        assignmentDriver();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            });
    });
}


function getRandomIndex() {
    return Math.floor(count + (Math.random() * 3));
}

function extractCorrectParagraphWord(correctIndex) {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            console.log('Extracting correct answer!'.blue);
            if (stringWordCount > 1) {
                var countString = '[' + stringWordCount + ']';
            } else {
                var countString = '';
            }
            var added = count + correctIndex - 1;
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[' + added + ']')).getText()
                .then(function (text) {
                    fufill(text);
                })
                .catch(function (err) {
                    reject(err);
                });
        }, 250);
    });
}


function findOppositeWord(prompt, a1, a2, a3, a4) {
    return new Promise(function (fufill, reject) {
        const options = {
            method: 'GET',
            uri: config.api.url + '/oppositeWord/find',
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
                console.log(resp);
                fufill(resp);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

function extractCorrectImageWord(correctIndex) {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            console.log('Extracting correct answer!'.blue);
            if (stringWordCount > 1) {
                var countString = '[' + stringWordCount + ']';
            } else {
                var countString = '';
            }
            var added = count + correctIndex - 1;
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[' + added + ']')).getText()
                .then(function (text) {
                    fufill(text);
                })
                .catch(function (err) {
                    reject(err);
                });
        }, 250);
    });
}

function guessRandomOppositeWord() {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            var randomNumber = Math.floor(Math.random() * tempChoices.length);
            var randomChoice = tempChoices[randomNumber];
            console.log('Stringwordcount is: ' + stringWordCount);
            if (stringWordCount > 1) {
                var countString = '[' + stringWordCount + ']';
            } else {
                var countString = '';
            }
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[' + randomChoice + ']'))
                .then(function (resp) {
                    driver.wait(until.elementIsVisible(resp), 5000).click()
                        .then(function (clicked) {
                            tempChoices.splice(randomNumber, 1);
                            console.log(tempChoices);
                            fufill(randomChoice);
                        })
                        .catch(function (errClick) {
                            goToAssignment(true)
                                .then(function () {
                                    stringWordCount = 1;
                                    numAchieve = 0;
                                    assignmentDriver();
                                })
                                .catch(function (err) {
                                    console.log(err);
                                });
                        });
                })
                .catch(function (err) {
                    goToAssignment(true)
                        .then(function () {
                            stringWordCount = 1;
                            numAchieve = 0;
                            assignmentDriver();
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                });
        }, 2000);
    });
}

function guessRandomImageWord() {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            var randomNumber = Math.floor(Math.random() * tempChoices.length);
            var randomChoice = tempChoices[randomNumber];
            console.log('Stringwordcount is: ' + stringWordCount);
            if (stringWordCount > 1) {
                var countString = '[' + stringWordCount + ']';
            } else {
                var countString = '';
            }
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[2]/a[' + randomChoice + ']'))
                .then(function (resp) {
                    driver.wait(until.elementIsVisible(resp), 5000).click()
                        .then(function (clicked) {
                            tempChoices.splice(randomNumber, 1);
                            console.log(tempChoices);
                            fufill(randomChoice);
                        })
                        .catch(function (errClick) {
                            goToAssignment(true)
                                .then(function () {
                                    stringWordCount = 1;
                                    numAchieve = 0;
                                    assignmentDriver();
                                })
                                .catch(function (err) {
                                    console.log(err);
                                });
                        });
                })
                .catch(function (err) {
                    goToAssignment(true)
                        .then(function () {
                            stringWordCount = 1;
                            numAchieve = 0;
                            assignmentDriver();
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                });
        }, 2000);
    });
}

function guessRandomStringWord() {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            var randomNumber = Math.floor(Math.random() * tempChoices.length);
            var randomChoice = tempChoices[randomNumber];
            console.log('Stringwordcount is: ' + stringWordCount);
            if (stringWordCount > 1) {
                var countString = '[' + stringWordCount + ']';
            } else {
                var countString = '';
            }

            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[' + randomChoice + ']')).click()
                .then(function (resp) {
                    tempChoices.splice(randomNumber, 1);
                    console.log(tempChoices);
                    fufill(randomChoice);
                })
                .catch(function (err) {
                    goToAssignment(true)
                        .then(function () {
                            stringWordCount = 1;
                            numAchieve = 0;
                            assignmentDriver();
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                });
        }, 2000);
    });
}

function extractCorrectStringWord(correctIndex) {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            console.log('Extracting correct answer!'.blue);
            if (stringWordCount > 1) {
                var countString = '[' + stringWordCount + ']';
            } else {
                var countString = '';
            }
            var added = count + correctIndex - 1;
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[' + added + ']')).getText()
                .then(function (text) {
                    fufill(text);
                })
                .catch(function (err) {
                    goToAssignment(true)
                        .then(function () {
                            stringWordCount = 1;
                            numAchieve = 0;
                            assignmentDriver();
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                });
        }, 250);
    });
}

function extractCorrectOppositeWord(correctIndex) {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            console.log('Extracting correct answer!'.blue);
            if (stringWordCount > 1) {
                var countString = '[' + stringWordCount + ']';
            } else {
                var countString = '';
            }
            var added = count + correctIndex - 1;
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[' + added + ']')).getText()
                .then(function (text) {
                    fufill(text);
                })
                .catch(function (err) {
                    reject(err);
                });
        }, 250);
    });
}

function extractCorrectSentenceWord(correctIndex) {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            console.log('Extracting correct answer!'.blue);
            if (stringWordCount > 1) {
                var countString = '[' + stringWordCount + ']';
            } else {
                var countString = '';
            }
            var added = count + correctIndex - 1;
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[' + added + ']')).getText()
                .then(function (text) {
                    fufill(text);
                })
                .catch(function (err) {
                    reject(err);
                });
        }, 250);
    });
}

function saveSentenceWord(prompt, a1, a2, a3, a4, lessonURL, addedBy, correctAnswer) {
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
        console.log('Saving sentenceWord to DB'.blue);
        const options = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            uri: config.api.url + '/sentenceWord/create',
            method: 'POST',
            body: qs.stringify(postData)
        }
        request(options)
            .then(function (resp) {
                fufill();
            })
            .catch(function (error) {
                console.log('ERROR');
                reject(error);
            });
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
        console.log('Saving stringWord to DB');
        const options = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            uri: config.api.url + '/stringWord/create',
            method: 'POST',
            body: qs.stringify(postData)
        }
        request(options)
            .then(function (resp) {
                fufill();
            })
            .catch(function (error) {
                console.log('ERROR');
                reject(error);
            });
    });

}

function saveParagraphWord(prompt, a1, a2, a3, a4, lessonURL, addedBy, correctAnswer) {
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
        console.log('Saving imageWord to DB'.blue);
        const options = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            uri: config.api.url + '/paragraphWord/create',
            method: 'POST',
            body: qs.stringify(postData)
        }
        request(options)
            .then(function (resp) {
                fufill();
            })
            .catch(function (error) {
                console.log('ERROR');
                console.log(error);
                reject(error);
            });
    });

}

function saveOppositeWord(prompt, a1, a2, a3, a4, lessonURL, addedBy, correctAnswer) {
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
        console.log('Saving imageWord to DB'.blue);
        const options = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            uri: config.api.url + '/oppositeWord/create',
            method: 'POST',
            body: qs.stringify(postData)
        }
        request(options)
            .then(function (resp) {
                fufill();
            })
            .catch(function (error) {
                console.log(error);
                console.log('ERROR');
                reject(error);
            });
    });

}


function saveImageWord(prompt, a1, a2, a3, a4, lessonURL, addedBy, correctAnswer) {
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
        console.log('Saving imageWord to DB'.blue);
        const options = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            uri: config.api.url + '/imageWord/create',
            method: 'POST',
            body: qs.stringify(postData)
        }
        request(options)
            .then(function (resp) {
                fufill();
            })
            .catch(function (error) {
                console.log('ERROR');
                console.log(error);
                reject(error);
            });
    });

}

function isCorrectMultipleChoice() {
    return new Promise(function (fufill, reject) {
        setTimeout(function () {
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div[' + stringWordCount + ']'))
                .then(function (resp) {
                    resp.getAttribute('class')
                        .then(function (classes) {
                            console.log('This element has classes: ' + classes);
                            if (classes.includes('complete')) {
                                console.log('Correct answer!'.green);
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


        }, 1000);
    });

}

//Bot functions
function login(username, password) {
    return new Promise(function (fufill, reject) {
        driver.get('https://www.vocabulary.com/login')
            .then(function () {
                driver.wait(until.elementLocated(By.name('username')), 100000, 'Could not locate the child element within the time specified').then(function () {
                    driver.findElement(By.name('username')).sendKeys(config.login.username);
                    driver.findElement(By.name('password')).sendKeys(config.login.password);
                    driver.findElement(By.xpath('//*[@id="loginform"]/div[6]/button')).click().then(function () {
                        fufill();
                    });
                }, function (err) {
                    console.log('Trying to reload the page. There was an error receiving the page or the program is out-of-date.')
                    reject(err);
                });
            })
            .catch(function (err) {

            })
    });
}

function getToken() {
    return new Promise(function (fufill, reject) {
        console.log('Logging in!'.blue);
        const options = {
            method: 'POST',
            uri: config.api.url + '/login',
            body: {
                'name': config.user.username,
                'password': config.user.password
            },
            json: true
        }

        request(options)
            .then(function (resp) {
                console.log('Logged in!'.blue);
                apiToken = resp.token;
                fufill(resp);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

function goToAssignment(isRedirect) {
    return new Promise(function (fufill, reject) {
        if (isRedirect) {
            driver.manage().deleteAllCookies().then(function(){
                driver.navigate().refresh()
                    .then(function(){
                        login()
                        .then(function () {
                            console.log('Logged in!');
                            goToAssignment(false)
                                .then(function () {
                                    console.log('Successfuly loaded page!');
                                    getToken()
                                        .then(function () {
                                            fufill();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        });
        
                                })
                                .catch(function (error) {
                                    console.log(error + ''.red);
                                });
        
        
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
        
                })
            })
            .catch(function(err){
                console.log(err);
            });

        } else {
            if (config.settings.lessonURL.includes('practice')) {
                console.log(config.settings.lessonURL);
                driver.get(config.settings.lessonURL)
                    .then(function () {
                        fufill();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            } else {
                config.settings.lessonURL = config.settings.lessonURL + '/practice';
                console.log(config.settings.lessonURL);
                driver.get(config.settings.lessonURL)
                    .then(function () {
                        fufill();
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
        }
    });

}


function findSentenceWord(prompt, a1, a2, a3, a4) {
    return new Promise(function (fufill, reject) {
        const options = {
            method: 'GET',
            uri: config.api.url + '/sentenceWord/find',
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
                console.log(resp);
                fufill(resp);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

function findStringWord(prompt, a1, a2, a3, a4) {
    return new Promise(function (fufill, reject) {
        const options = {
            method: 'GET',
            uri: config.api.url + '/stringWord/find',
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
                console.log(resp);
                fufill(resp);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

function findParagraphWord(prompt, a1, a2, a3, a4) {
    return new Promise(function (fufill, reject) {
        const options = {
            method: 'GET',
            uri: config.api.url + '/paragraphWord/find',
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
                console.log(resp);
                fufill(resp);
            })
            .catch(function (error) {
                reject(error);
            });
    });
};


function findImageWord(prompt, a1, a2, a3, a4) {
    return new Promise(function (fufill, reject) {
        const options = {
            method: 'GET',
            uri: config.api.url + '/imageWord/find',
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
                console.log(resp);
                fufill(resp);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}


function saveAudioWord(prompt, correctAnswer) {
    return new Promise(function (fufill, reject) {
        var postData = {
            token: apiToken,
            prompt: prompt,
            lessonURL: config.settings.lessonURL,
            addedBy: config.login.username,
            correctAnswer: correctAnswer
        };
        console.log('Saving imageWord to DB'.blue);
        const options = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            uri: config.api.url + '/audioWord/create',
            method: 'POST',
            body: qs.stringify(postData)
        }
        request(options)
            .then(function (resp) {
                fufill();
            })
            .catch(function (error) {
                console.log(error);
                console.log('ERROR');
                reject(error);
            });
    });

}

function getCurrentTask() {
    return new Promise(function (fufill, reject) {
        console.log(config.api.url + '/queue/currentTask');
        const options = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            uri: config.api.url + '/queue/currentTask',
            method: 'GET'
        }
        request(options)
            .then(function (respo) {
                try {
                    var resp = JSON.parse(respo);
                    console.log(resp);
                    queueObject = resp;
                    config.user.username = resp[0].config.apiLogin.username;
                    config.user.password = resp[0].config.apiLogin.password;
                    config.login.username = resp[0].config.user.username;
                    config.login.password = resp[0].config.user.password;
                    config.settings.lessonURL = resp[0].config.assignmentURL;
                    console.log(config);
                    fufill(resp);

                } catch (err){
                    console.log(err);
                    driver.quit();
                }
            })
            .catch(function (error) {
                console.log(error);
                reject(error);
            });
    });
}
/*
function countNumberQuestions() {
    return new Promise(function(fufill, reject) {
        driver.findElement(By.xpath('//*[@id="challenge"]/div/footer/div[2]/ul'))
            .then(function(elements) {
                elements.getAttribute("innerHTML")
                    .then(function(inner) {
                        console.log(inner);
                        var numLi = ((occurrences(inner, "li", false)) / 2);
                        var realNumLi = stringWordCount * -.5;
                        fufill(.5 + numLi + realNumLi);
                    })
                    .catch(function(errInner) {
                        console.log(errInner);
                    });

            })
            .catch(function(errElements) {
                console.log(errElements);
            });
    });
} */

function occurrences(string, subString, allowOverlapping) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

function isComplete() {
    return new Promise(function (fufill, reject) {
        driver.findElements(By.className('practiceComplete'))
            .then(function (resp) {
                if (resp.length != 0) {
                    setComplete(100)
                        .then(function () {
                            fufill(true);
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                } else {
                    fufill(false);
                }
            })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });
    });
}

function setComplete(completePercent) {
    return new Promise(function (fufill, reject) {
        var postData = {
            token: apiToken,
            completepercent: parseInt(completePercent),
            id: queueObject[0]._id
        };
        console.log('Saving imageWord to DB'.blue);
        console.log(queueObject);
        const options = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            uri: config.api.url + '/queue/completeTask/',
            method: 'POST',
            body: qs.stringify(postData)
        }
        request(options)
            .then(function (resp) {
                fufill();
            })
            .catch(function (error) {
                console.log(error);
                reject(error);
            });
    });
}

function completePercent() {
    return new Promise(function (fufill, reject) {

    });
}