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
    .then(function(resp) {
        console.log('Successfully connected to DB!');
    })
    .catch(function(err) {
        console.log(err);
    });



start();


//THESE FUNCTIONS CONTROL THE BOT'S ESSENTIAL LOOP

function start() {
    login()
        .then(function() {
            console.log('Logged in!');
            goToAssignment()
                .then(function() {
                    console.log('Successfuly loaded page!');
                    getToken()
                        .then(function(data) {
                            console.log('Start loop complete!'.blue);
                            assignmentDriver();
                        })
                        .catch(function(error) {
                            console.log(error + ''.red);
                        });

                })
                .catch(function(err) {
                    console.log(err);
                });
        })
        .catch(function(err) {
            console.log(err);
        });
}

/*  Steps to driving the assignment:
1. 
*/
//this function does all of the driving (moving from question to question, etc)
function assignmentDriver() {
    isMovable(function(){
        console.log('Finished moving!'.blue);
        tempChoices = [1, 2, 3, 4];
        questionDriver()
            .then(function(){
        
            })
            .catch(function(answerErr){
        
            });
    });
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
    question TypeF = paragraphWord
    question TypeI = imageWord

*/
function questionDriver(){
    return new Promise(function(fufilled, reject){
        if(stringWordCount > 1){
            var countString = '['+ stringWordCount + ']';
        } else {
            var countString = '';
        }
       driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div'+ countString +'/div/div/section[1]/div[1]'))
            .then(function(dClass){
                console.log('Assesing the question type!'.blue);
                dClass.getAttribute('class')
                    .then(function(divClass){
                        console.log(divClass);
                        if(divClass.includes('typeD') || divClass.includes('typeS')){
                            console.log('Stringword'.yellow);
                            answerStringWord()
                                .then(function(){
                                    assignmentDriver();
                                })
                                .catch(function(errSW){

                                });
                        } else if (divClass.includes('typeL') || divClass.includes('typeP') || divClass.includes('typeH')){
                            console.log('SentenceWord'.yellow);
                            answerSentenceWord()
                                .then(function(){
                                    assignmentDriver();
                                })
                                .catch(function(errS){
                                    assignmentDriver();
                                })
                        } else if (divClass.includes('typeF')){
                            console.log('ParagraphWord'.yellow);
                        }
                    })
                    .catch(function(errClass){
                        console.log(errClass);
                    });
            })
            .catch(function(errDiv){

            });
    });
}



function answerStringWord() {
    return new Promise(function(fufill, reject){
        if(stringWordCount > 1){
            var countString = '[' + stringWordCount + ']';
        } else {
            var countString = '';
        }
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).getText()
        .then(function(a1) {
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[3]')).getText()
            .then(function(prompt) {
                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).getText()
                .then(function(a2) {
                    driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).getText()
                    .then(function(a3) {
                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).getText()
                        .then(function(a4) {
                            console.log(a4);
                            //try to pull data from the prompt, if not found, guess and save the correct answer
                            findStringWord(prompt, a1, a2, a3,a4)
                                .then(function(data){
                                    console.log(data);
                                    if(data.answer){
                                        //TODO: check if its correct
                                        if(data.answer === a1){
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div' + countString + '/div/div/div/section[1]/div[1]/div[4]/a[' + count + ']')).click()
                                            .then(function() {
                                                console.log('Clicked answer 1!'.blue);
                                                stringWordCount++;
                                                fufill();
                                            })
                                            .catch(function(clicka1){
                                                console.log(clicka1);
                                                reject(clicka1);
                                            });
                                        } else if (data.answer === a2){
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div' + countString + '/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 1) + ']')).click()
                                            .then(function() {
                                                console.log('Clicked answer 2!'.blue);
                                                stringWordCount++;
                                                fufill();
                                            })
                                            .catch(function(clicka2){
                                                console.log(clicka2);
                                                reject(clicka2);
                                            });
                                        } else if (data.answer === a3){
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div' + countString + '/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 2) + ']')).click()
                                            .then(function() {
                                                console.log('Clicked answer 3!'.blue);
                                                stringWordCount++;
                                                fufill();
                                            })
                                            .catch(function(clicka3){
                                                console.log(clicka3);
                                                reject(clicka3);
                                            });
                                        } else if (data.answer === a4){
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div' + countString + '/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 3) + ']')).click()
                                            .then(function() {
                                                console.log('Clicked answer 4!'.blue);
                                                stringWordCount++;
                                                fufill();
                                            })
                                            .catch(function(clicka4){
                                                console.log(clicka4);
                                                reject(clicka4);
                                            });
                                        }
                                    } else if(!data.answer){
                                        guessRandomStringWord()
                                            .then(function(randomNumber1){
                                                isCorrectMultipleChoice()
                                                    .then(function(isCorrect1){
                                                        if(isCorrect1){
                                                            extractCorrectStringWord(randomNumber1)
                                                            .then(function(correctAnswer1) {
                                                                stringWordCount++;
                                                                saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer1)
                                                                    .then(function() {
                                                                        console.log('Saving stringWord!'.blue);

                                                                        fufill();
                                                                    })
                                                                    .catch(function(errSaveStringWord1) {
                                                                        console.log(errSaveStringWord1);
                                                                    });
                                                            })
                                                            .catch(function(err) {
    
                                                            }); 
                                                        } else {
                                                            guessRandomStringWord()
                                                            .then(function(randomNumber2){
                                                                isCorrectMultipleChoice()
                                                                    .then(function(isCorrect2){
                                                                        if(isCorrect2){
                                                                            extractCorrectStringWord(randomNumber2)
                                                                            .then(function(correctAnswer2) {
                                                                                stringWordCount++;
                                                                                saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer2)
                                                                                    .then(function() {
                                                                                        console.log('Saving stringWord!'.blue);
                                                                                        fufill();
                                                                                    })
                                                                                    .catch(function(errSaveStringWord2) {
                                                                                        console.log(errSaveStringWord2);
                                                                                    });
                                                                            })
                                                                            .catch(function(err) {
                    
                                                                            }); 
                                                                        } else {
                                                                            guessRandomStringWord()
                                                                                .then(function(randomNumber3){
                                                                                    isCorrectMultipleChoice()
                                                                                        .then(function(isCorrect3){
                                                                                            if(isCorrect3){
                                                                                                extractCorrectStringWord(randomNumber3)
                                                                                                .then(function(correctAnswer3){
                                                                                                    stringWordCount++;
                                                                                                    saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer3)
                                                                                                    .then(function() {
                                                                                                        console.log('Saving stringWord!'.blue);
                                                                                                        fufill();
                                                                                                    })
                                                                                                    .catch(function(errSaveStringWord2) {
                                                                                                        console.log(errSaveStringWord2);
                                                                                                    });
                                                                                                })
                                                                                            } else {
                                                                                                guessRandomStringWord()
                                                                                                    .then(function(randomNumber4){
                                                                                                        isCorrectMultipleChoice()
                                                                                                            .then(function(isCorrect4){
                                                                                                                extractCorrectStringWord(randomNumber4)
                                                                                                                    .then(function(correctAnswer4){
                                                                                                                        stringWordCount++;
                                                                                                                        console.log('Preparing to save!'.blue);
                                                                                                                        saveStringWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer4)
                                                                                                                        .then(function() {
                                                                                                                            console.log('Saving stringWord!'.blue);
                                                                                                                            fufill();
                                                                                                                        })
                                                                                                                        .catch(function(errSaveStringWord2) {
                                                                                                                            console.log(errSaveStringWord2);
                                                                                                                        });
                                                                                                                    })
                                                                                                                    .catch(function(correctAnswer4Err){
                                                                                                                        console.log(correctAnswer4Err);
                                                                                                                    });
                                                                                                            })
                                                                                                            .catch(function(isCorrect4Err){
                                                                                                                console.log(isCorrect4Err);
                                                                                                            })
                                                                                                    })
                                                                                                    .catch(function(randomNumber4Err){
                                                                                                        console.log(randomNumber4Err);
                                                                                                    });
                                                                                            }
                                                                                        })
                                                                                        .catch(function(isCorrect3Err){
                                                                                            console.log(isCorrect3Err);
                                                                                        });
                                                                                })
                                                                                .catch(function(randomNumber3Err){
                                                                                    console.log(randomNumber3Err);
                                                                                });
                                                                        }
                                                                    })
                                                                    .catch(function(isCorrect2Err){
                                                                        console.log(isCorrect2Err);
                                                                    })
                                                            })
                                                            .catch(function(randomNumber2Err){
                                                                console.log(randomNumber2Err);
                                                            });
                                                        }
                                                    })
                                                    .catch(function(isCorrect1Err){
                                                        console.log(isCorrect1Err);
                                                    })
                                            })
                                            .catch(function(randomNumber1Err){
                                                console.log(randomNumber1Err);
                                            });
                                    }
                                })
                                .catch(function(findSWErr){
                                    console.log(findSWerr);
                                });
                        })
                        .catch(function(erra4){
                            console.log(erra4);
                        });
                    })
                    .catch(function(erra3){
                        console.log(erra3);
                    });
                })
                .catch(function(erra2){
                    console.log(erra2);
                });
            })
            .catch(function(errPrompt){
                console.log(errPrompt);
            });
        })
        .catch(function(erra1){
            console.log(erra1);
        });
    });
}

function answerSentenceWord() {
    return new Promise(function(fufill, reject){
        if(stringWordCount > 1){
            var countString = '['+ stringWordCount + ']';
        } else {
            var countString = '';
        }
        //*[@id="challenge"]/div/div[1]/div[4]/div/div/section[1]/div[1]/div[4]/a[1]
        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[1]')).getText()
        .then(function(a1) {
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString +'/div/div/section[1]/div[1]/div[2]/div')).getText()
            .then(function(prompt) {
                driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[2]')).getText()
                .then(function(a2) {
                    driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[3]')).getText()
                    .then(function(a3) {
                        driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[4]')).getText()
                        .then(function(a4) {
                            //try to pull data from the prompt, if not found, guess and save the correct answer
                            findStringWord(prompt, a1, a2, a3,a4)
                                .then(function(data){
                                    console.log(data);
                                    if(data.answer){
                                        //TODO: check if its correct
                                        if(data.answer === a1){
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div' + countString + '/div/div/div/section[1]/div[1]/div[4]/a[1]')).click()
                                            .then(function() {
                                                console.log('Clicked answer 1!'.blue);
                                                stringWordCount++;
                                                fufill();
                                            })
                                            .catch(function(clicka1){
                                                console.log(clicka1);
                                                reject(clicka1);
                                            });
                                        } else if (data.answer === a2){
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div' + countString + '/div/div/div/section[1]/div[1]/div[4]/a[2]')).click()
                                            .then(function() {
                                                console.log('Clicked answer 2!'.blue);
                                                stringWordCount++;
                                                fufill();
                                            })
                                            .catch(function(clicka2){
                                                console.log(clicka2);
                                                reject(clicka2);
                                            });
                                        } else if (data.answer === a3){
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div' + countString + '/div/div/div/section[1]/div[1]/div[4]/a[3]')).click()
                                            .then(function() {
                                                console.log('Clicked answer 3!'.blue);
                                                stringWordCount++;
                                                fufill();
                                            })
                                            .catch(function(clicka3){
                                                console.log(clicka3);
                                                reject(clicka3);
                                            });
                                        } else if (data.answer === a4){
                                            driver.findElement(By.xpath('//*[@id="challenge"]/div/div' + countString + '/div/div/div/section[1]/div[1]/div[4]/a[4]')).click()
                                            .then(function() {
                                                console.log('Clicked answer 4!'.blue);
                                                stringWordCount++;
                                                fufill();
                                            })
                                            .catch(function(clicka4){
                                                console.log(clicka4);
                                                reject(clicka4);
                                            });
                                        }
                                    } else if(!data.answer){
                                        guessRandomStringWord()
                                            .then(function(randomNumber1){
                                                isCorrectMultipleChoice()
                                                    .then(function(isCorrect1){
                                                        if(isCorrect1){
                                                            extractCorrectSentenceWord(randomNumber1)
                                                            .then(function(correctAnswer1) {
                                                                stringWordCount++;
                                                                saveSentenceWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer1)
                                                                    .then(function() {
                                                                        console.log('Saving sentenceWord!'.blue);

                                                                        fufill();
                                                                    })
                                                                    .catch(function(errSaveStringWord1) {
                                                                        console.log(errSaveStringWord1);
                                                                    });
                                                            })
                                                            .catch(function(err) {
    
                                                            }); 
                                                        } else {
                                                            guessRandomStringWord()
                                                            .then(function(randomNumber2){
                                                                isCorrectMultipleChoice()
                                                                    .then(function(isCorrect2){
                                                                        if(isCorrect2){
                                                                            extractCorrectSentenceWord(randomNumber2)
                                                                            .then(function(correctAnswer2) {
                                                                                stringWordCount++;
                                                                                saveSentenceWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer2)
                                                                                    .then(function() {
                                                                                        console.log('Saving sentenceWord!'.blue);
                                                                                        fufill();
                                                                                    })
                                                                                    .catch(function(errSaveStringWord2) {
                                                                                        console.log(errSaveStringWord2);
                                                                                    });
                                                                            })
                                                                            .catch(function(err) {
                    
                                                                            }); 
                                                                        } else {
                                                                            guessRandomStringWord()
                                                                                .then(function(randomNumber3){
                                                                                    isCorrectMultipleChoice()
                                                                                        .then(function(isCorrect3){
                                                                                            if(isCorrect3){
                                                                                                extractCorrectSentenceWord(randomNumber3)
                                                                                                .then(function(correctAnswer3){
                                                                                                    stringWordCount++;
                                                                                                    saveSentenceWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer3)
                                                                                                    .then(function() {
                                                                                                        console.log('Saving sentenceWord!'.blue);
                                                                                                        fufill();
                                                                                                    })
                                                                                                    .catch(function(errSaveStringWord2) {
                                                                                                        console.log(errSaveStringWord2);
                                                                                                    });
                                                                                                })
                                                                                            } else {
                                                                                                guessRandomStringWord()
                                                                                                    .then(function(randomNumber4){
                                                                                                        isCorrectMultipleChoice()
                                                                                                            .then(function(isCorrect4){
                                                                                                                extractCorrectSentenceWord(randomNumber4)
                                                                                                                    .then(function(correctAnswer4){
                                                                                                                        stringWordCount++;
                                                                                                                        saveSentenceWord(prompt, a1, a2, a3, a4, config.settings.lessonURL, config.login.username, correctAnswer4)
                                                                                                                        .then(function() {
                                                                                                                            console.log('Saving sentenceWord!'.blue);
                                                                                                                            fufill();
                                                                                                                        })
                                                                                                                        .catch(function(errSaveStringWord2) {
                                                                                                                            console.log(errSaveStringWord2);
                                                                                                                        });
                                                                                                                    })
                                                                                                                    .catch(function(correctAnswer4Err){
                                                                                                                        console.log(correctAnswer4Err);
                                                                                                                    });
                                                                                                            })
                                                                                                            .catch(function(isCorrect4Err){
                                                                                                                console.log(isCorrect4Err);
                                                                                                            })
                                                                                                    })
                                                                                                    .catch(function(randomNumber4Err){
                                                                                                        console.log(randomNumber4Err);
                                                                                                    });
                                                                                            }
                                                                                        })
                                                                                        .catch(function(isCorrect3Err){
                                                                                            console.log(isCorrect3Err);
                                                                                        });
                                                                                })
                                                                                .catch(function(randomNumber3Err){
                                                                                    console.log(randomNumber3Err);
                                                                                });
                                                                        }
                                                                    })
                                                                    .catch(function(isCorrect2Err){
                                                                        console.log(isCorrect2Err);
                                                                    })
                                                            })
                                                            .catch(function(randomNumber2Err){
                                                                console.log(randomNumber2Err);
                                                            });
                                                        }
                                                    })
                                                    .catch(function(isCorrect1Err){
                                                        console.log(isCorrect1Err);
                                                    })
                                            })
                                            .catch(function(randomNumber1Err){
                                                console.log(randomNumber1Err);
                                            });
                                    }
                                })
                                .catch(function(findSWErr){
                                    console.log(findSWerr);
                                });
                        })
                        .catch(function(erra4){
                            console.log(erra4);
                        });
                    })
                    .catch(function(erra3){
                        console.log(erra3);
                    });
                })
                .catch(function(erra2){
                    console.log(erra2);
                });
            })
            .catch(function(errPrompt){
                console.log(errPrompt);
            });
        })
        .catch(function(erra1){
            console.log(erra1);
        });
    });
}

// THESE ARE THE BOTS UTILITY FUNCTIONS



function isMovable(callback){
    console.log('Checking if is able to be moved!'.blue);
    driver.findElement(By.xpath('//*[@id="challenge"]/div/div[2]/button'))
        .then(function(arrClass){
            arrClass.getAttribute('class')
            .then(function(arrowClass){
                if(arrowClass.includes('active')){
                    console.log('Checking for active class!'.blue);
                    driver.findElement(By.xpath('//*[@id="challenge"]/div/div[2]/button')).click()
                        .then(function(){
                            console.log('Looping movement again!'.blue)
                            isMovable(callback);
                        })
                        .catch(function(errClick){
                            console.log(errClick + ''.red);
                        });
                } else {
                    setTimeout(callback, 1000);
                }
            })
            .catch(function(moveErr){
                console.log(moveErr + '.blue');
            })
        })
        .catch(function(error){
            console.log('Not found! Must mean there is nothing left to click!'.blue);
            callback();
        });
}


function getRandomIndex() {
    return Math.floor(count + (Math.random() * 3));
}

function guessRandomStringWord() {
    return new Promise(function(fufill, reject) {
        setTimeout(function() {
            var randomNumber = Math.floor(Math.random() * tempChoices.length);
            var randomChoice = tempChoices[randomNumber];
            console.log('Stringwordcount is: ' + stringWordCount);
            if(stringWordCount > 1){
                var countString = '['+ stringWordCount + ']';
            } else {
                var countString = '';
            }
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[' + randomChoice + ']'))
                .then(function(resp) {
                    driver.wait(until.elementIsVisible(resp), 5000).click()
                        .then(function(clicked){
                            tempChoices.splice(randomNumber, 1);
                            console.log(tempChoices);
                            fufill(randomChoice);
                        })
                        .catch(function(errClick){
                            console.log(errClick);
                        });
                })
                .catch(function(err) {
                    reject(err);
                });
        }, 2000);
    });
}


function extractCorrectStringWord(correctIndex) {
    return new Promise(function(fufill, reject) {
        setTimeout(function() {
            console.log('Extracting correct answer!'.blue);
            if(stringWordCount > 1){
                var countString = '['+ stringWordCount+ ']';
            } else {
                var countString = '';
            }
            var added = count + correctIndex - 1;
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString +'/div/div/section[1]/div[1]/div[4]/a[' + added + ']')).getText()
                .then(function(text) {
                    fufill(text);
                })
                .catch(function(err) {
                    reject(err);
                });
        }, 250);
    });
}


function extractCorrectSentenceWord(correctIndex) {
    return new Promise(function(fufill, reject) {
        setTimeout(function() {
            console.log('Extracting correct answer!'.blue);
            if(stringWordCount > 1){
                var countString = '['+ stringWordCount+ ']';
            } else {
                var countString = '';
            }
            var added = count + correctIndex - 1;
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div' + countString + '/div/div/section[1]/div[1]/div[4]/a[' + added + ']')).getText()
                .then(function(text) {
                    fufill(text);
                })
                .catch(function(err) {
                    reject(err);
                });
        }, 250);
    });
}

function saveSentenceWord(prompt, a1, a2, a3, a4, lessonURL, addedBy, correctAnswer) {
    return new Promise(function(fufill, reject) {
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
            .then(function(resp) {
                fufill();
            })
            .catch(function(error) {
                console.log('ERROR');
                reject(error);
            });
    });

}



function saveStringWord(prompt, a1, a2, a3, a4, lessonURL, addedBy, correctAnswer) {
    return new Promise(function(fufill, reject) {
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
            .then(function(resp) {
                fufill();
            })
            .catch(function(error) {
                console.log('ERROR');
                reject(error);
            });
    });

}

function isCorrectMultipleChoice() {
    return new Promise(function(fufill, reject) {
        setTimeout(function() {
            driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div[' + stringWordCount + ']'))
                .then(function(resp) {
                    resp.getAttribute('class')
                        .then(function(classes) {
                            console.log('This element has classes: ' + classes);
                            if (classes.includes('complete')) {
                                console.log('Correct answer!'.green);
                                fufill(true);
                            } else {
                                fufill(false);
                            }
                        })
                        .catch(function(errClass) {
                            console.log(errClass);
                            reject(errClass)
                        });
                })
                .catch(function(err) {
                    console.log(err);
                    reject(err);
                });


        }, 1000);
    });

}

//Bot functions
function login(username, password) {
    driver.get('https://www.vocabulary.com/login');
    return new Promise(function(fufill, reject) {
        driver.wait(until.elementLocated(By.name('username')), 100000, 'Could not locate the child element within the time specified').then(function() {
            driver.findElement(By.name('username')).sendKeys(config.user.username);
            driver.findElement(By.name('password')).sendKeys(config.user.password);
            driver.findElement(By.xpath('//*[@id="loginform"]/div[6]/button')).click().then(function() {
                fufill();
            });
        }, function(err) {
            console.log('Trying to reload the page. There was an error receiving the page or the program is out-of-date.')
            reject(err);
        });
    });
}

function getToken() {
    return new Promise(function(fufill, reject) {
        console.log('Logging in!'.blue);
        const options = {
            method: 'POST',
            uri: config.api.url + '/login',
            body: {
                'name': config.login.username,
                'password': config.login.password
            },
            json: true
        }

        request(options)
            .then(function(resp) {
                console.log('Logged in!'.blue);
                apiToken = resp.token;
                fufill(resp);
            })
            .catch(function(error) {
                reject(error);
            });
    });
}

function goToAssignment() {
    return new Promise(function(fufill, reject) {
        if (config.settings.lessonURL.includes('practice')) {
            driver.get(config.settings.lessonURL)
                .then(function() {
                    fufill();
                })
                .catch(function(err) {
                    reject(err);
                });
        } else {
            config.settings.lessonURL = config.settings.lessonURL + '/practice';
            driver.get(config.settings.lessonURL)
                .then(function() {
                    fufill();
                })
                .catch(function(err) {
                    reject(err);
                });
        }

    });

}

function findStringWord(prompt, a1, a2, a3, a4) {
    return new Promise(function(fufill, reject) {
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
            .then(function(resp) {
                fufill(resp);
            })
            .catch(function(error) {
                reject(error);
            });
    });
};