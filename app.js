// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require("axios");
const ejs = require("ejs");
const puppeteer = require("puppeteer");

// Initialize Express app
const app = express();
let ItemModel = require("./models/ItemModel")
require("web-streams-polyfill")
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"));


const HistoryModel = require("./models/HistoryModel")
const UserModel = require("./models/UserModel")


// MongoDB connection
mongoose.connect("mongodb+srv://mikhailkalashnikov1947:7755777Ss@cluster0.3paejwu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});


// Translation data
let active = "en";
const translate = require("./models/translate");

// Routes

// Authentication Route
app.post("/auth", async function (req, res) {
    try {
        console.log("hereee")
        const foundItems = await UserModel.find({
            username: req.body.name,
            password: req.body.password
        });

        if (foundItems.length > 0) {
            const founded = foundItems[0]
            res.json(founded);
        } else {
            res.json("error");
        }
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).send('Internal Server Error');
    }
});

// User Registration Route
app.post("/register", async (req, res) => {
    try {


        const foundedUser = await UserModel.find({
            username: req.body.username,
            password: req.body.password
        }).lean()
        if (foundedUser.length > 0) {
            res.json("error")
            return;
        }
        const value = await UserModel.create({
            username: req.body.username,
            password: req.body.password,
            creationDate: new Date(),
            updateDate: new Date(),
            isAdmin: false
        });
        res.json(value)
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Translation Route
app.get("/translate", async (req, res) => {
    active = (active === "ru") ? "en" : "ru";
    try {
        const users = await UserModel.find({}).lean();
        const pipeline = [
            // Lookup user by ID
            {
                $match: {_id: new mongoose.mongo.ObjectId(req.params.id)}
            },
            // Project only required fields
            {
                $project: {username: 1, isAdmin: 1, creationDate: 1, updateDate: 1}
            },
            // Lookup history by userId
            {
                $lookup: {
                    from: 'histories',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'history'
                }
            }
        ];
        const history = await UserModel.aggregate(pipeline);
        res.render("charts", {
            users: users,
            animals: animals,
            thesaurus: thesaurus,
            history: history[0],
            translate: translate[active]
        });
    } catch (err) {
        console.error('Error fetching translation data:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Admin Route
app.get("/admin", async function (req, res) {
    try {
        const allUsers = await UserModel.find({}).lean()

        let items = await ItemModel.find({}).lean();

        items = items.map((item) => {
            return {
                ...item,
                images: [item.imageFirst, item.imageSecond, item.imageThree]
            }
        })
        res.render("admin", {users: allUsers, activeLanguage: "kz", items: items, translate:translate[active]});
    } catch (err) {
        console.error('Error reading users:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Charts Route
app.get("/charts/:id", async (req, res) => {
    try {
        const users = await UserModel.find({}).lean();
        const items = await require("./models/ItemModel").find({}).lean()
        const celebrity = await require("./models/CelebrityModel").find({}).lean();
        const pipeline = [
            // Lookup user by ID
            {
                $match: {_id: new mongoose.mongo.ObjectId(req.params.id)}
            },
            // Project only required fields
            {
                $project: {username: 1, isAdmin: 1, creationDate: 1, updateDate: 1}
            },
            // Lookup history by userId
            {
                $lookup: {
                    from: 'histories',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'history'
                }
            }
        ];
        const history = await UserModel.aggregate(pipeline);
        res.render("charts", {
            users: users,
            celebrity: celebrity,
            items: items,
            history: history[0],
            translate: translate[active]
        });
    } catch (err) {
        console.error('Error fetching data for charts:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.get("/main", async (req, res) => {





    let items = await ItemModel.find({}).lean()
    items = items.map((item) => {
        return {
            ...item,
            images: [
                item.imageFirst,
                item.imageSecond,
                item.imageThree,
            ],
            name: {
                kz: item.name.kz,
                en: item.name.en
            },
            description: {
                kz: item.description.kz,
                en: item.description.en
            },
        }
    })
    res.render("main", {
        items: items
    })
})


// Admin Delete Route
app.delete("/delete-item", async function (req, res) {
    try {
        await ItemModel.deleteOne({_id: req.body.id});
        res.json("User deleted successfully");
    } catch (err) {
        console.error('Error deleting admin:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.post("/create-item", async function (req, res) {
    console.log(req.body)
    try {
        await ItemModel.create({
            ...req.body,
            name: {
                kz: req.body.kazakhName,
                en: req.body.englishName
            },
            description: {
                kz: req.body.kazakhDescription,
                en: req.body.descriptionEn
            }
        });
        res.json("User deleted successfully");
    } catch (err) {
        console.error('Error deleting admin:', err);
        res.status(500).send('Internal Server Error');
    }
});
app.put("/update-item", async function (req, res) {
    try {
        await ItemModel.updateOne(
            {_id: req.body.id},
            {
                name: {
                    kz: req.body.kazakhName,
                    en: req.body.englishName
                },


                description: {
                    kz: req.body.kazakhDescription,
                    en: req.body.englishDescription,
                },
                imageFirst: req.body.imageFirst,
                imageSecond: req.body.imageSecond,
                imageThree: req.body.imageThree,
                updatedAt: new Date()
            }
        );

        const result = await ItemModel.find({}).lean();
        res.json("success")
    } catch (err) {
        console.error('Error updating admin:', err);
        res.status(500).send('Internal Server Error');
    }
});
app.get("/quiz", async (req, res) => {
    try {

        res.render("quiz", {});
    } catch (err) {
        console.error('Error fetching data for charts:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.get("/celebrity", async (req, res) => {
    console.log(req.query)
    const CelebrityModel = require("./models/CelebrityModel")
    if (Boolean(req.query.value) == true) {
        try {
            const result = await axios.get("https://api.api-ninjas.com/v1/celebrity", {
                params: {
                    name: req.query.value
                },
                headers: {
                    'X-Api-Key': 'PLTZf0U4hgA9wCYJkx5fbw==Fb1lDyLYBhRu2vxO'
                }
            });


            console.log(result.data)

            let foundedAnimals = await CelebrityModel.find({
                name: result.data[0].name
            }).lean()
            if (foundedAnimals.length == 0) {
                await CelebrityModel.create({
                    ...result.data[0]
                });


                foundedAnimals = await CelebrityModel.find({
                    name: result.data[0].name
                }).lean()
            }


            await HistoryModel.create({
                userId: req.query.id,
                prompt: req.query.value,
                creationDate: new Date(),
                type: "celebrity",
                isAnswer: true
            })
            res.json({
                celebrity: foundedAnimals
            })
        } catch (err) {
            console.error('Error fetching country data:', err);
            res.status(500).send('Internal Server Error');
        }
    } else {
        try {
            res.render("celebrity", {
                translate: translate[active],
                celebrity: undefined
            });
        } catch (err) {
            console.error('Error fetching country data:', err);
            res.status(500).send('Internal Server Error');
        }
    }
});

// Country Route


// PDF Download Route
app.get("/pdfdownload/:id", (req, res) => {
    res.render("pdfpage", {
        translate: translate[active],
        id: req.params.id
    });
});

// PDF Generation Route
app.get("/pdfhistory", async (req, res) => {
    if (req.query.type === "userHistory") {
        try {
            let userHistory = [];
            let templatePath = "";
            let outputPath = "./history.pdf";

            // Utility function to convert EJS to PDF
            async function convertEJStoPDF(templatePath, data, outputPath) {
                const browser = await puppeteer.launch({timeout: 0, protocolTimeout: 0});
                const page = await browser.newPage();
                console.log(data[0].history, "hereeeeeeeeeee")
                const htmlContent = await ejs.renderFile(templatePath, {
                    userHistory: data,
                    translate: translate[active]
                });

                await page.setContent(htmlContent);
                await page.pdf({path: outputPath, timeout: 0, format: 'A4'});
                await browser.close();

                console.log(`PDF generated successfully at: ${outputPath}`);
            }

            const pipeline = [
                // Lookup user by ID
                {
                    $match: {_id: new mongoose.mongo.ObjectId(req.query.id)}
                },
                // Project only required fields
                {
                    $project: {username: 1, isAdmin: 1, creationDate: 1, updateDate: 1}
                },
                // Lookup history by userId
                {
                    $lookup: {
                        from: 'histories',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'history'
                    }
                }
            ];

            // Execute the aggregate query
            userHistory = await UserModel.aggregate(pipeline);
            console.log(userHistory)

            templatePath = "./public/historyUser.ejs";


            await convertEJStoPDF(templatePath, userHistory, outputPath);
            res.sendFile(__dirname + "/history.pdf");
        } catch (err) {
            console.error('Error generating PDF:', err);
            res.status(500).send('Internal Server Error');
        }
    }
    if (req.query.type === "userList") {
        try {
            let userHistory = [];
            let templatePath = "";
            let outputPath = "./history.pdf";

            // Utility function to convert EJS to PDF
            async function convertEJStoPDF(templatePath, data, outputPath) {
                const browser = await puppeteer.launch({timeout: 0, protocolTimeout: 0});
                const page = await browser.newPage();
                const htmlContent = await ejs.renderFile(templatePath, {
                    userList: data,
                    translate: translate[active]
                });

                await page.setContent(htmlContent);
                await page.pdf({path: outputPath, timeout: 0, format: 'A4'});
                await browser.close();

                console.log(`PDF generated successfully at: ${outputPath}`);
            }

            // Execute the aggregate query
            userHistory = await UserModel.find({}).lean()
            console.log(userHistory)

            templatePath = "./public/userList.ejs";


            await convertEJStoPDF(templatePath, userHistory, outputPath);
            res.sendFile(__dirname + "/history.pdf");
        } catch (err) {
            console.error('Error generating PDF:', err);
            res.status(500).send('Internal Server Error');
        }
    }
    if (req.query.type === "charts") {
        try {
            let userHistory = [];
            let templatePath = "";
            let outputPath = "./history.pdf";
            const users = await UserModel.find({}).lean();
            const pipeline = [
                // Lookup user by ID
                {
                    $match: {_id: new mongoose.mongo.ObjectId(req.query.id)}
                },
                // Project only required fields
                {
                    $project: {username: 1, isAdmin: 1, creationDate: 1, updateDate: 1}
                },
                // Lookup history by userId
                {
                    $lookup: {
                        from: 'histories',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'history'
                    }
                }
            ];
            const history = await UserModel.aggregate(pipeline);

            // Utility function to convert EJS to PDF
            async function convertEJStoPDF(templatePath, data, outputPath) {
                const browser = await puppeteer.launch({timeout: 0, protocolTimeout: 0});
                const page = await browser.newPage();
                console.log(animals, users, thesaurus, history[0])
                const htmlContent = await ejs.renderFile(templatePath, {
                    users: users,
                    country: [],
                    userHistory: [],
                    animals: animals,
                    thesaurus: thesaurus,
                    history: history[0],
                    translate: translate[active]
                });

                await page.setContent(htmlContent);
                await new Promise(r => setTimeout(r, 2000));
                await page.pdf({path: outputPath, timeout: 0, format: 'A4'});
                await browser.close();

                console.log(`PDF generated successfully at: ${outputPath}`);
            }

            templatePath = "./public/charts.ejs";


            await convertEJStoPDF(templatePath, userHistory, outputPath);
            res.sendFile(__dirname + "/history.pdf");
        } catch (err) {
            console.error('Error generating PDF:', err);
            res.status(500).send('Internal Server Error');
        }
    }
    if (req.query.type === "commonData") {
        console.log("hereeeeeeeeeeeeeeeeee")
        try {
            let userHistory = [];
            let templatePath = "";
            let outputPath = "./history.pdf";

            // Utility function to convert EJS to PDF
            async function convertEJStoPDF(templatePath, data, outputPath) {
                const browser = await puppeteer.launch({timeout: 0, protocolTimeout: 0});
                const page = await browser.newPage();
                console.log(data[0].history, "hereeeeeeeeeee")
                const htmlContent = await ejs.renderFile(templatePath, {
                    historyUsers: data,
                    translate: translate[active]
                });

                await page.setContent(htmlContent);
                await page.pdf({path: outputPath, timeout: 0, format: 'A4'});
                await browser.close();

                console.log(`PDF generated successfully at: ${outputPath}`);
            }

            // Execute the aggregate query
            userHistory = await HistoryModel.find({});
            console.log(userHistory)

            templatePath = "./public/historyUsers.ejs";


            await convertEJStoPDF(templatePath, userHistory, outputPath);
            res.sendFile(__dirname + "/history.pdf");
        } catch (err) {
            console.error('Error generating PDF:', err);
            res.status(500).send('Internal Server Error');
        }
    }
});


// History User Route
app.get("/history/:id", async (req, res) => {
    try {
        const pipeline = [
            // Lookup user by ID
            {
                $match: {_id: new mongoose.mongo.ObjectId(req.params.id)}
            },
            // Project only required fields
            {
                $project: {username: 1, isAdmin: 1, creationDate: 1, updateDate: 1}
            },
            // Lookup history by userId
            {
                $lookup: {
                    from: 'histories',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'history'
                }
            }
        ];


        const result = await UserModel.aggregate(pipeline)
        res.render("historyUser", {
            userHistory: result,
            translate: translate[active]
        });
    } catch (err) {
        console.error('Error fetching history user data:', err);
        res.status(500).send('Internal Server Error');
    }
});


// Create User Route
app.post("/create-user", async (req, res) => {
    try {
        await UserModel.create({
            username: req.body.username,
            password: req.body.password,
            creationDate: new Date(),
            updateDate: new Date(),
            deletionDate: new Date(),
            admin: req.body.isAdmin
        });
        res.json("User created successfully");
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Admin Update Route
app.put("/admin", async function (req, res) {
    try {
        await UserModel.updateOne(
            {_id: req.body.id},
            {username: req.body.username, password: req.body.password, isAdmin: req.body.isAdmin}
        );

        const result = await UserModel.find({}).lean();
        res.render("admin", {users: result, translate: translate[active]});
    } catch (err) {
        console.error('Error updating admin:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Admin Delete Route
app.delete("/admin", async function (req, res) {
    try {
        await UserModel.deleteOne({_id: req.body.id});
        res.json("User deleted successfully");
    } catch (err) {
        console.error('Error deleting admin:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Root Route
app.get("/", async function (req, res) {
    try {
        res.render("auth", {translate: translate[active]});
    } catch (err) {
        console.error('Error reading users:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
});