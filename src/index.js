const express = require("express");
const { User, Booking, Admin, TotalProfit, Service } = require("./mongodb"); // Import User and Booking and Admin models
const session = require("express-session");
const multer = require('multer');
const path = require('path');
require("dotenv").config();

const app = express();

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));


// Set up storage for images
const storage = multer.diskStorage({
    destination: './public/uploads/', // Directory where images will be stored
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload variable
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Limit the file size to 1MB
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('serviceImage'); // 'serviceImage' is the name of the input field for the image

// Function to check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/; // Accepted file types
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}




app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.use(express.static("public"));

const isAuthenticated = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'user') {
        return next();
    }
    res.redirect("/login");
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.redirect("/admin-login");
}

app.post("/admin-login", async (req, res) => {
    try {
        const admin = await Admin.findOne({ adminName: req.body.username });
        if (!admin) {
            return res.send("Admin not found");
        }

        if (req.body.password === admin.adminPassword) {
            req.session.user = { adminName: req.body.username, role: 'admin' };

            req.session.save((err) => {
                if (err) return res.send("An error occurred while saving the session.");
                return res.redirect("/admin");
            });
        } else {
            return res.send("<h1>Incorrect password</h1>");
        }
    } catch (err) {
        console.log(err);
        return res.send("An error occurred during login.");
    }
});

app.get("/admin", isAdmin, async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const services = await Service.find({});

        const totalCustomers = await Booking.distinct('email').countDocuments();

        const recentBookings = await Booking.find().sort({ time: -1 }).limit(10);
        const totalProfitData = await TotalProfit.findOne();
        const totalProfit = totalProfitData ? totalProfitData.totalProfit : 0;

        res.render("admin", {
            totalBookings,
            recentBookings,
            totalCustomers,
            totalProfit,
            services
        });
    } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        res.status(500).send("Error loading admin dashboard.");
    }
});


app.post('/admin/delete-booking/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).send({ message: 'Booking not found' });
        }
        const totalProfitDoc = await TotalProfit.findOne();

        if (totalProfitDoc && booking.totalPay) {
            totalProfitDoc.totalProfit -= parseFloat(booking.totalPay);
            await totalProfitDoc.save();
        }

        const result = await Booking.findByIdAndDelete(bookingId);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).send("Error deleting booking");
    }
});


app.post('/admin/update-booking-status/:bookingId', async (req, res) => {
    const { bookingId } = req.params;
    const { paymentStatus, serviceStatus } = req.body;

    try {

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                ...(paymentStatus && { paymentStatus }),
                ...(serviceStatus && { serviceStatus })
            },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, message: 'Status updated successfully!', updatedBooking });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



app.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ name: req.body.username }); // Use User model
        if (!user) {
            return res.send("User not found");
        }

        if (req.body.password === user.password) {
            req.session.user = { name: req.body.username, role: 'user' };

            req.session.save((err) => {
                if (err) return res.send("An error occurred while saving session.");
                return res.redirect("/");
            });
        } else {
            return res.send("<h1>Incorrect password</h1>");
        }
    } catch (error) {
        console.error(error);
        res.send("An error occurred during login");
    }
});

app.post("/signup", async (req, res) => {
    try {
        const data = {
            name: req.body.username,
            password: req.body.password,
        };

        const existingUser = await User.findOne({ name: data.name }); // Use User model
        if (existingUser) {
            return res.send("<h1>User already exists.</h1>");
        } else {
            await User.create(data); // Use create instead of insertMany
            req.session.user = { name: data.name };

            req.session.save((err) => {
                if (err) return res.send("An error occurred while saving session.");
                return res.redirect("/");
            });
        }
    } catch (error) {
        console.error(error);
        res.send("An error occurred during sign-up");
    }
});




app.post("/booking", isAuthenticated, async (req, res) => {
    try {
        // Create a new booking object from the request body
        const newBooking = {
            username: req.body.name,
            email: req.body.email,
            mobile_no: req.body.phone,
            address: req.body.address,
            carMake: req.body.carMake,
            carModel: req.body.carModel,
            vehicle_no: req.body.vehicleNo,
            servicePackage: req.body.servicePackage,
            servicePrice: req.body.servicePrice,
            serviceDate: req.body.serviceDate,
            serviceTime: req.body.serviceTime,
            pickUpAdd: req.body.pickupAddress,
            paymentMode: "cash on delivery",
            pickUpPrice: 99, // Changed to Number
            totalPay: parseFloat(req.body.totalPay), // Convert to Number
            paymentStatus: "Pending",
            serviceStatus: "Pending"
        };

        const booking = new Booking(newBooking);
        await booking.save();

        // Update totalProfit
        await TotalProfit.findOneAndUpdate(
            {},
            { $inc: { totalProfit: booking.totalPay } },
            { new: true, upsert: true }
        );
        res.redirect("/confirm");

    } catch (error) {
        console.error("Error booking appointment:", error);
        res.status(500).send("An error occurred while booking the appointment.");
    }
});



app.get('/viewAppointment', isAuthenticated, async (req, res) => {
    try {
        // Fetch Booking for the authenticated user
        const bookings = await Booking.find({ username: req.session.user.name });
        // const bookings = await Booking.find({ username: req.body.name });

        // Render the appointments page with the fetched data
        res.render('viewAppointment', { bookings });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).send('Error fetching appointments');
    }
});


app.post('/cancel-booking/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).send({ message: 'Booking not found' });
        }
        console.log("Booking found:", booking);
        let totalProfitDoc = await TotalProfit.findOne();
        if (!totalProfitDoc) {
            totalProfitDoc = new TotalProfit({ totalProfit: 0 });
            await totalProfitDoc.save();
        }
        const totalPay = parseFloat(booking.totalPay);
        if (!isNaN(totalPay)) {
            console.log("TotalPay:", totalPay);
            totalProfitDoc.totalProfit -= totalPay;
            await totalProfitDoc.save();
        } else {
            console.error("Invalid totalPay value:", booking.totalPay);
        }
        await Booking.findByIdAndDelete(bookingId);
        res.redirect('/viewAppointment');
    } catch (error) {
        console.error('Error canceling booking:', error);
        res.status(500).send("Error canceling booking");
    }
});


app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.send("An error occurred while logging out.");
        }
        res.redirect("/");
    });
});

app.get("/Logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.send("An error occurred while logging out.");
        }
        res.redirect("/admin-login");
    });
});

app.get("/", (req, res) => {
    res.render("index", { user: req.session.user });
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/about", (req, res) => {
    res.render("about", { user: req.session.user });
})

app.get("/services", isAuthenticated,(req, res) => {
    res.render("services", { user: req.session.user });
});

// Route to add a service
app.post('/admin/add-service',  async (req, res) => {
    
    upload(req,res,async (err)=>{
        if(err){
            return res.render('admin',{msg : err});
        }
        else{
            if(req.file==undefined){
                return res.render('admin',{msg :'No file selected'});
            }
            else{
                const { serviceName, serviceDescription, originalPrice, discountedPrice, timeTaken,imagePath, features = '', hiddenFeatures = '', isRecommended, carMake, carModel } = req.body;

                const newService = new Service({
                    name: serviceName,
                    description: serviceDescription,
                    imagePath: `/uploads/${req.file.filename}`,
                    originalPrice: originalPrice,
                    discountedPrice: discountedPrice,
                    timeTaken: timeTaken,
                    features: features.split(',').map(feature => feature.trim()),
                    hiddenFeatures: hiddenFeatures.split(',').map(hiddenFeature => hiddenFeature.trim()),
                    isRecommended: isRecommended === 'true',
                    carMake: carMake,
                    carModel: carModel
                });
                
            
                try {
                    await newService.save();
                    res.redirect('/admin#manage-services');
                } catch (error) {
                    console.error('Error adding service:', error);
                    res.status(500).send('Server error');
                }
            }
        }
    });
});



app.post('/admin/remove-service/:id', async (req, res) => {
    try {
        
        const serviceId = req.params.id;

        await Service.findByIdAndDelete(serviceId);

       
        res.redirect('admin'); 
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/admin/remove-service/admin',async(req,res)=>
{})





app.get('/swift', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'maruti' && service.carModel.toLowerCase() === 'swift'
        );

        res.render('swift', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});




app.get('/ertiga', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'maruti' && service.carModel.toLowerCase() === 'ertiga'
        );

        res.render('ertiga', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});


app.get('/wagonr', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'maruti' && service.carModel.toLowerCase() === 'wagonr'
        );

        res.render('wagonr', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});


app.get('/fortuner', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'toyota' && service.carModel.toLowerCase() === 'fortuner'
        );

        res.render('fortuner', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});


app.get('/innova', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'toyota' && service.carModel.toLowerCase() === 'innova'
        );

        res.render('innova', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});


app.get('/yaris', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'toyota' && service.carModel.toLowerCase() === 'yaris'
        );

        res.render('yaris', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});


app.get('/creta', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'hyundai' && service.carModel.toLowerCase() === 'creta'
        );

        res.render('creta', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});


app.get('/i20', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'hyundai' && service.carModel.toLowerCase() === 'i20'
        );

        res.render('i20', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});

app.get('/venue', isAuthenticated,async (req, res) => {
    try {
        const allServices = await Service.find(); 
        const services = allServices.filter(service => 
            service.carMake.toLowerCase() === 'hyundai' && service.carModel.toLowerCase() === 'venue'
        );

        res.render('venue', { services: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Server error');
    }
});

app.get("/booking", (req, res) => {
    res.render("booking");
});

app.get("/cart", (req, res) => {
    res.render("cart");
});

app.get("/confirm", isAuthenticated, (req, res) => {
    res.render("confirm");
});

app.get("/admin-login", (req, res) => {
    res.render("admin-login");
})

const port = 5000;
app.listen(port, () => {
    console.log(`Server running on PORT ${port}`);
});

