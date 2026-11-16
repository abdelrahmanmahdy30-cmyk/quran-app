
const { createHafs } = require('quran-meta');
const hafs = createHafs();
console.log('hafs methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(hafs)));
