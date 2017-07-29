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
var config = require('./config.json');
var mongoose = require('mongoose');
var imageWord = require('./models/imageWord');
var audioWord = require('./models/audioWord');
var stringWord = require('./models/stringWord');
var sentenceWord = require('./models/sentenceWord');
var Promise = require('promise');
//the index for the first question in the set of four (images, multiple choice) NOT short answer questions
var count = 1;

//initialization fun
var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

var driver = new webdriver.Builder()
   .withCapabilities(webdriver.Capabilities.chrome())
   .build();

mongoose.connect(config.database);

//bot logic
goToVocabLogin();
function goToVocabLogin(){
   driver.get('https://www.vocabulary.com/login/');
   driver.wait(until.elementLocated(By.name('username')), 100000, 'Could not locate the child element within the time specified').then(function(){
       console.log('The page has loaded!');
       driver.findElement(By.name('username')).sendKeys(config.username);
       driver.findElement(By.name('password')).sendKeys(config.password);
       driver.findElement(By.xpath('//*[@id="loginform"]/div[6]/button')).click();
       startAssignment();
   }, function(err){
       goToVocabLogin();
       console.log('Trying to reload the page. There was an error receiving the page or the program is out-of-date.')
   });
}

//make recursive. check for certain scenarios and run the handler for them. loop until mastery == 100% or until user is done
function startAssignment(){
   driver.get(config.assignment).then(function(){
       areQuestionsPresent();
   });

}

function doQuestion(questionType){
   const multipleChoice = 0;
   const shortAnswer = 2;
   if(questionType === multipleChoice){
       //DO MULTIPLE CHOICE
   }

   if(questionType === shortAnswer){
       //DO SHORT ANSWER
   }
}

//this function works for images AND multiple choice
//goTo is a function used for going straight to the driver function
function areQuestionsPresent(){
  
}

function findMultipleChoiceType(){
   driver.findElements(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + count + ']')).then(function(resolved){
       //looks at the first question in the choices and checks to see if there is text. If there is text, it must be a multiple choice question
       var questionOne = driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + count + ']'));
       questionOne.getText().then(function(resolved){
           if(resolved === ''){
               assignmentDriver('imageChoice');
           } else {
               assignmentDriver('multipleChoice');
           }
       });
   }, function(err){
           if(err){
               throw err;
           }
   });
}

function isShortAnswerPresent(){
   driver.wait(until.elementLocated(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[2]/div[2]/input')), 100000, 'Could not locate the child element within the time specified').then(function(resolved){
       driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[2]/div[2]/input')).then(function(res){
           if(res.length == 1){
               if(driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div[5]/div/div/section[1]/div[1]/div[2]/div[2]/input')).isEnabled()){
                   console.log('The question is short answer');
               }
           }
       });
   }, function(err){
       throw err;
   });
}

function assignmentDriver(questionType){
   scrapeAnswer();
   //this is the driver for the bot, its job is to identify the type of question.
   //while it may seem intuitive what type of question it is, there is a lot more logic that goes into it than just checking elements
   //this part doesn't do the answering or the guessing, it simply identifies, and primes the bot for answering
   if(questionType === 'multipleChoice'){
       console.log('The question is multiple choice!');
       driver.findElements(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[2]/div')).then(function(res){
           /*
               Everything here is currently working. It is able to strip the word from the sentence, and save the question to the DB. If the bot cannot find the answer in the DB,
               it needs to guess for the answer and learn it based off of which element turns green. This means that as the bot matures, it will learn more-and-more
               answer sets.
           */

           driver.findElements(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[3]')).then(function(instructions){
               //make sure that the instruction array has instructions in it
               if(instructions.length > 0){
                   instructions[0].getText().then(function(text){
                       if(instructions.length == 1){
                           //helps clarify whether the question is a stringWord or a sentenceWord so the database can be queried correctly
                           if(text.toLowerCase().indexOf('means') != -1 || text.toLowerCase().indexOf('opposite') != -1){
                               console.log('This must be a stringWord sentence!');
                               console.log(text.replace(/\s/g, '').replace('means', '').replace(':', ''));

                           } else {
                               console.log('This must be the sentenceWord sentence!');
                               saveQuestionToDB('sentenceWord', text);
                           }
                       }
                   });
               }
           });  
       });
      
   } else if(questionType === 'imageChoice') {
       console.log('This question must be an image choice!');
   } else {
       console.log('The question must be short answer!');
   }
}

//presses the correct multiple choice button AND navigates to the next through the arrow buttons
function pressAnswer(questionData){

}

//if the bot has no idea, it will guess, and it will learn the correct answer
function guess(){

}

//pulls the four answer choices from the screen (THIS IS FOR MULTIPLE CHOICE QUESTIONS)
function scrapeAnswer(){
   return new Promise(function(resolve,reject){
       var options = [];
       driver.wait(until.elementLocated(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + count + ']')), 100000, 'Could not locate element in the time extent').then(function(resolved){
           driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + count + ']')).getText().then(function(choiceOne){
               options[0] = choiceOne;
               driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 1) + ']')).getText().then(function(choiceTwo){
                   options[1] = choiceTwo;
                   driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 2) + ']')).getText().then(function(choiceThree){
                       options[2] = choiceThree;
                       driver.findElement(By.xpath('//*[@id="challenge"]/div/div[1]/div/div/div/section[1]/div[1]/div[4]/a[' + (count + 3) + ']')).getText().then(function(choiceFour){
                           options[3] = choiceFour;
                           resolve(options);
                       });
                   });
               });
           });
       });
   });
}

//after guessing, the bot will learn the answer from using the first green answer it finds
function learnAnswer(){
                                  //TODO: Come back and fill in the correct answer
                saveQuestionToDB('stringWord',
                    {
                        word : resolved.replace(/\s/g, '').replace('means', '').replace(':', ''),
                        answer : 'test'
                    });
}


//db logic
   function saveQuestionToDB(questionType, questionData, questionAnswer){
       //question data is a general variable that is used to pass the data for the question. this is NOT a JSON
       //first check to see the type so we know which collection to check
       //now, check to see if it has already been entered into the DB
       if(questionType === 'stringWord'){
           stringWord.find({stringValues : questionData}, function(err, res){
               if(res.length == 1){
                   return;
               } else {
                   return new Promise(function(resolve,reject){
                       var word = new stringWord({
                               word : questionData,
                               answer : questionAnswer,
                               datedCreated : moment()
                       });
                       word.save(function(err){
                           console.log(err);
                           if(err){
                               reject();
                               throw err;
                           }
                           resolve();
                       });
                   });
    
               }
             
           });
       } else if(questionType === 'imageChoice') {
           console.log('This question must be an image choice!');
           imageWord.find({stringValues : questionData}, function(err, res){
               if(res.length == 1){
                   return;
               } else {
                   return new Promise(function(resolve,reject){
                       var word = new imageChoice({
                               word : questionData,
                               datedCreated : moment(),
                               imageValue : questionAnswer
                       });
                       word.save(function(err){
                           console.log(err);
                           if(err){
                               reject();
                               throw err;
                           }
                           resolve();
                       });
                   });
    
               }
             
           });
       } else if(questionType === 'sentenceWord'){
           sentenceWord.find({stringValues : questionData}, function(err, res){
               if(res.length == 1){
                   return;
               } else {
                   return new Promise(function(resolve,reject){
                       var word = new sentenceWord({
                               instruction: questionData,
                               answer : questionAnswer,
                               datedCreated : moment()
                       });
                       word.save(function(err){
                           console.log(err);
                           if(err){
                               reject();
                               throw err;
                           }
                           resolve();
                       });
                   });
    
               }
             
           });
       } else {
           audioWord.find({stringValues : questionData}, function(err, res){
               if(res.length == 1){
                   return;
               } else {
                   return new Promise(function(resolve,reject){
                       var word = new audioWord({
                           word : questionAnswer,
                           datedCreated : moment(),
                           instruction : questionData,
                           audioValues : null
                       });
                       word.save(function(err){
                           console.log(err);
                           if(err){
                               reject();
                               throw err;
                           }
                           resolve();
                       });
                   });
    
               }
             
           });
           console.log('The question must be short answer!');
       }


}


//looks in the DB for the given word and returns the possible answers.
//The client, then, will be responsible for finding the answer out of the given set.
   function findAnswer(wordValue, questionType){
       //wordValue is a general variable. It is used for giving data on the question for all the different categories.
       if(questionType === 'stringWord'){
          return new Promise(function(resolve, reject){
               stringWord.find({word : wordValue}, function(err, list){
                   if(err){
                       reject(err);
                       return;
                   } else {
                       resolve(list);
                   }
               });
          });
       } else if (questionType === 'sentenceWord'){
           return new Promise(function(resolve, reject){
               sentenceWord.find({instruction : wordValue}, function(err, list){
                   if(err){
                       reject(err);
                       return;
                   } else {
                       resolve(list);
                   }
               });
           });
       } else if (questionType === 'imageChoice'){
           return new Promise(function(resolve, reject){
               imageWord.find({imageValue : wordValue}, function(err, list){
                   if(err){
                       reject(err);
                       return;
                   } else {
                       resolve(list);
                   }
               });
           });
       } else if (questionType === 'shortAnswer'){
           return new Promise(function(resolve, reject){
               audioWord.find({instruction : wordValue}, function(err, list){
                   if(err){
                       reject(err);
                       return;
                   } else {
                       resolve(list);
                   }
               });
           });
       }
}

