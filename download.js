const fs = require('fs');
const https = require('https');

const url = "https://raw.githubusercontent.com/pmndrs/drei-assets/master/macbook.glb";
const dest = "./frontend/public/models/macbook.glb";

https.get(url, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Status Code: ${res.statusCode}`);
        return;
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log("Download completed!");
    });
}).on('error', (err) => {
    console.error(`Error: ${err.message}`);
});
