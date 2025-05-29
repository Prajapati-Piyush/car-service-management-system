const mongoose = require("mongoose");
// const mongoURI = "mongodb+srv://anandpandey1765:AYv5hDWMmvcJ4Ziz@carservicesdb.iijjd.mongodb.net/?retryWrites=true&w=majority&appName=CarServicesDB";
const mongoURI = "mongodb+srv://53a12thpiy:TJQPzW5iHa008hSq@cluster0.5z2iz1b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error.message);
    });

const LogInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
    },
    password: {
        type: String,
        required: true,
    }
});
const User = mongoose.model("User", LogInSchema);



// Define the booking schema
const bookingSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trime: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    mobile_no: {
        type: String,
        required: true,
        match: [/^[6-9]\d{9}$/, 'Please fill a valid 10-digit phone number starting with 6-9']
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    carMake: {
        type: String,
        required: true
    },
    carModel: {
        type: String,
        required: true
    },
    vehicle_no: {
        type: String,
        required: true,
        match: [/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, 'Please fill a valid vehicle number']
    },
    servicePackage: {
        type: String,
        required: true
    },
    servicePrice: {
        type: String,
        required: true,
        min: [0, 'Price must be positive']
        // match: [, 'Please fill a valid price (e.g., ₹ 3569)']
    },
    serviceDate: {
        type: Date,
        required: true
    },
    serviceTime: {
        type: String,
        required: true
    },
    pickUpAdd: {
        type: String,
        trim: true
    },
    paymentMode: {
        type: String,
        default: 'cash on delivery',
        immutable: true
    },

    pickUpPrice: {
        type: String,
        required: true,
        default: '99'
    },
    totalPay: {
        type: Number,
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Paid']
    },
    serviceStatus: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'In Progress', 'Completed']
    }
});

// Create the Booking model
const Booking = mongoose.model('Booking', bookingSchema);

const totalProfitSchema = new mongoose.Schema({
    totalProfit: {
        type: Number,
        required: true,
        default: 0
    }
});

// Create the TotalProfit model
const TotalProfit = mongoose.model('TotalProfit', totalProfitSchema);



const AdminSchema = new mongoose.Schema({
    adminName: {
        type: String,
        required: true,
        minlength: 3,
    },
    adminPassword: {
        type: String,
        required: true,
        minlength: 3,
    }
});

const Admin = mongoose.model("Admin", AdminSchema);

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    imagePath: {
        type: String,
        required: true
    },
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    timeTaken: { type: Number, required: true },
    features: { type: [String], required: true },
    hiddenFeatures: { type: [String], required: true },
    isRecommended: { type: Boolean, default: false },
    carMake: { type: String, required: true }, // Add this line
    carModel: { type: String, required: true } // Add this line
});


const Service = mongoose.model("Service", serviceSchema);

module.exports = { User, Booking, Admin, TotalProfit, Service };




