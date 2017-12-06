
module.exports = {
        login: function (driver, config) {
                return new Promise(function (fufill, reject) {
                        driver.get('https://www.vocabulary.com/login')
                            .then(function () {
                                driver.wait(until.elementLocated(By.name('username')), 100000, 'Could not locate the child element within the time specified').then(function () {
                                        driver.findElement(By.name('username')).sendKeys(config.vocabUser.username);
                                        driver.findElement(By.name('password')).sendKeys(config.vocabUser.password);
                                        driver.findElement(By.xpath('//*[@id="loginform"]/div[6]/button'))
                                            .click()
                                            .then(function () {
                                                driver.findElement(By.xpath('//*[@id="loginform"]/div[1]/p[1]'))
                                                    .getText()
                                                    .then(function(text){
                                                        fufill(false);
                                                    })
                                                    .catch(function(err){
                                                        fufill(true);
                                                    });
                                            })
                                            .catch(function(err){
                                                reject(err);
                                            });
                                    })
                                    .catch(function (err) {
                                        reject(err);
                                    });
                            });
                    });
                }
            }