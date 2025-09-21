const mongoose = require('mongoose')

const schema = {
    sessionDuration: {type:Number, required: true},
    xCoordinates: {type:[Number], required:true},
    yCoordinates: {type:[Number], required:true},
    typingSpeed: {type:Number, required: true}, // per second
    interKeyDelayAvg: {type:Number, required: true}, // ms
    totalKeystrokes: {type:Number, required: true},
    typingSpeedCPM: {type:Number, required: true}
}

module.exports = mongoose.model('testData', schema, 'testData')