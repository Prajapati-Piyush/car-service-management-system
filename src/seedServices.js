const mongoose = require('mongoose');
const { Service } = require('./mongodb');  // Import the Service model and ensure connection is handled by mongodb.js

const services = [
    {
        name: 'Standard Service',
        description: '1000 Kms or 1 Month Warranty • Every 10,000 Kms or 6 Months (Recommended)',
        imageUrl: '/img/p1.jpg',
        originalPrice: 5527,
        discountedPrice: 3869,
        timeTaken: 6,
        features: ['Car Scanning', 'Battery Water Top up', 'Interior Vacuuming (Carpet & Seats)', 'Wiper Fluid Replacement', 'Car Wash'],
        hiddenFeatures: ['Brake Fluid Check', 'Engine Oil Check', 'AC Filter Cleaning', 'Tire Pressure Check', 'Light Bulb Inspection'],
        isRecommended: true
    },
    {
        name: 'Basic Service',
        description: '1000 Kms or 1 Month Warranty • Every 5000 Kms or 3 Months (Recommended)',
        imageUrl: '/img/p2.jpeg',
        originalPrice: 4359,
        discountedPrice: 3269,
        timeTaken: 4,
        features: ['Wiper Fluid Replacement', 'Car Wash', 'Engine Oil Replacement', 'Battery Water Top up', 'Interior Vacuuming (Carpet & Seats)'],
        hiddenFeatures: ['Fuel Filter Check', 'Radiator Fluid Check', 'Tire Rotation'],
        isRecommended: false
    },
    {
        name: 'Comprehensive Service',
        description: '1000 Kms or 1 Month Warranty • Every 20000 Kms or 12 Months (Recommended)',
        imageUrl: '/img/p6.jpeg',
        originalPrice: 8456,
        discountedPrice: 5919,
        timeTaken: 8,
        features: ['AC Filter Replacement', 'Gear Oil Top Up', 'Wiper Fluid Replacement', 'Car Wash', 'Engine Oil Replacement', 'Battery Water Top up', 'Interior Vacuuming (Carpet & Seats)'],
        hiddenFeatures: ['Fuel Filter Check', 'Radiator Fluid Check', 'Tire Rotation', 'Brake Fluid Top Up', 'Engine Flushing'],
        isRecommended: false
    }
];

Service.insertMany(services)
    .then(() => {
        console.log('Services seeded successfully');
        mongoose.connection.close(); // Close the connection once seeding is complete
    })
    .catch(err => {
        console.log(err);
        mongoose.connection.close(); // Close the connection in case of an error
    });
