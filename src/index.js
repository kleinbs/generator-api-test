const express = require('express');
const axios = require('axios');

const app = express();
const port = 4000;

/**
 * Set up a express route that will randomly succeed/fail.
 * This is to test out our unreliable network connection
 */
app.get('/', (req, res) => {
    const isGoodRequest = Math.floor(Math.random() * 50) === 1

    if(isGoodRequest) {
        console.log('Request was successful')
        res.send({success: true})
    } else {
        console.log('Request was not successful')
        res.status(400).send({success: false})
    }
})

/**
 * Set up our Express index, once it's set up, we call our retry code
 * @type {http.Server}
 */
const index = app.listen(port, () => {
    console.log('Server is up and running')
    runRetry((success) => {
        console.log('Response was successful with result: ', success.data)
        index.close(() => {
            console.log('Server successfully shutdown')
        })
    })
})

/**
 * This function accepts a success function and a generator
 * On the first run, no generator should be supplied, so it will use our generator
 * If result is a success, we will execute the onSuccess function and pass in the response
 * If our result is a failure, we will recursively call this function and pass in our generator so our place is saved
 *
 * @param onSuccess function to execute on success
 * @param generator should only send generator recursively
 */
function runRetry(onSuccess, generator) {

    if(!generator){
        generator = makeApiCall();
    }

    const result = generator.next();
    result.value.then((response) => {
        onSuccess(response)
    }).catch(err => {
        debugger;
        console.error('Response was a failure with result: ', err.response.data)
        runRetry(onSuccess, generator);
    })
}

/**
 * Will run this loop infinitely, calling the yield whenever the .next() function is called on our generator.
 * The yield keyword pauses our generator until the .next() function is called
 * @returns {Generator<Promise<AxiosResponse<any>>, void, *>}
 */
function *makeApiCall() {
    while(true){
        yield axios.get('http://localhost:4000/')
    }
}