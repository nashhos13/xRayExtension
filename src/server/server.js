import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import puppeteer from 'puppeteer'
import http from 'http'
import { WebSocketServer } from 'ws'

const app = express()
const port = 3000
const server = http.createServer(app)
const wss = new WebSocketServer({server, path: '/products'})

app.use(bodyParser.json())
app.use(cors())

let productsOfInterest = {}

app.get("/", (req, res) => {
    res.send("Hello")
    window.postMessage({
        direction: "from-web",
        message: "Message from web app!!!"
    }, "*")
})

app.get("/products", (req, res) => {
    res.json(productsOfInterest)
})


app.post("/receive-url", async (req, res) => {
    
    console.log("Connected")

    const url = req.body.product.url;
    console.log("Current URL: ", url)
    console.log("Received from extension:", req.body.product.images)


    try {

        console.log("Begin")

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const elements = await page.$$('[data-csa-c-action*="image-hover"]');
        console.log("Elements found:", elements.length);

        for (const [i, el] of elements.entries()) {
            const box = await el.boundingBox();
            const isConnected = await el.evaluate(node => node.isConnected);

            if (box && isConnected) {
                console.log(`Element ${i} is visible and in DOM`);

                await el.hover();

                try {
                    // Wait for the image with both "image" and "selected" classes
                    await page.waitForSelector('.image.selected', { visible: true, timeout: 3000 });

                    // Grab the image element inside the hovered container
                    const imgHandle = await page.$('.image.selected img');

                    if (imgHandle) {
                        const src = await imgHandle.getProperty('src');
                        const srcValue = await src.jsonValue();

                        if (!req.body.product.images.includes(srcValue)) { 
                            req.body.product.images.push(srcValue) 
                        }

                        console.log(`Image ${i} src:`, srcValue);

                        } else {
                            console.warn(`Image ${i} not found inside selected container`);
                        }

                    } catch (err) {
                        console.warn(`Timeout or error while processing image ${i}:`, err.message);
                    }

            } else {
                console.warn(`Element ${i} is not interactable`);
            }

        }   


        await browser.close();

        const newProduct = {
            [req.body.product.url]: req.body.product
        }

        productsOfInterest[req.body.product.url] = req.body.product
        console.log("Product: ", newProduct)

        res.send({ status: "Success"});

    } catch (error) {
        console.error("Scraping error:", error);
        res.status(500).send({ status: "Error", message: error.message });
    }

});


server.listen(port, () => {
    console.log("Successful connection on port ", port);
})

wss.on('connection', (ws) => {
    console.log("Client Connected!!!!!!!")

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.action === 'getProduct') {

            // console.log("looking for product - ", data.productUrl)
            if (data.productUrl in productsOfInterest) {
                ws.send(JSON.stringify({
                    action: 'productFound',
                    message: productsOfInterest[data.productUrl]
                }))
            } else {
                ws.send(JSON.stringify({
                    action: "noProduct",
                    message: "Product Not Found"
                }))
            }
        }
    })
})




