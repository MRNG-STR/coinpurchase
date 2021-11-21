var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cron = require('node-cron');
const axios = require('axios');
const { Pool } = require('pg')
var cors = require('cors');

const pgconfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'meynikaracoinDB',
    password: 'Arun@123',
    port: 5433,
}

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
//buying the coin API
app.post('/buycoin', async function (req, res) {
    console.log(req.body);
    var postdata = req.body;
    try {
        var pool = new Pool(pgconfig);
        pool.connect();
        const result = await pool.query('SELECT acc_balance from public.user_detail');

        let required_price = parseInt(postdata.qty) * parseFloat(postdata.set_price);

        if (required_price > result.rows[0].acc_balance) {
            return res.end(JSON.stringify({ response: "Your balance is insufficient to set price" }));
        }
        //immediate purchases when equal values
        if (postdata.set_price == postdata.coin_price) {
            let status = 'SUCCESS';
            const query = {
                text: 'INSERT INTO public.user_trxn_detail(qty, trxn_type, set_price, coin_id, status) VALUES($1,$2,$3,$4,$5)',
                values: [postdata.qty, postdata.trxn_type, postdata.set_price, postdata.coin_id, status],
            }
            const result1 = await pool.query(query);
            if (result1.rowCount > 0) {
                const result2 = await pool.query('UPDATE public.user_detail SET acc_balance = acc_balance - ' + required_price);
                return res.end(JSON.stringify({ status:200,response: "Coin added in your account" }));
            }
        } else { //queued upto equal price
            let status = 'QUEUED';
            const query = {
                text: 'INSERT INTO public.user_trxn_detail(qty, trxn_type, set_price, coin_id, status) VALUES($1,$2,$3,$4,$5)',
                values: [postdata.qty, postdata.trxn_type, postdata.set_price, postdata.coin_id, status],
            }
            const result1 = await pool.query(query);
            if (result1.rowCount > 0) {
                return res.end(JSON.stringify({ status:200,response: "Coin queued in your account" }));
            }
        }
        await pool.end();
    }
    catch (err) {
        console.log(err)
    }
})
//Selling the coin API
app.post('/sellcoin', async function (req, res) {
    console.log(req.body);
    var postdata = req.body;
    try {
        var pool = new Pool(pgconfig);
        pool.connect();
        const result = await pool.query('SELECT acc_balance from public.user_detail');

        let required_price = parseInt(postdata.qty) * parseFloat(postdata.set_price);

        //immediate purchases when equal values
        if (postdata.set_price == postdata.coin_price) {
            let status = 'SUCCESS';
            const query = {
                text: 'INSERT INTO public.user_trxn_detail(qty, trxn_type, set_price, coin_id, status) VALUES($1,$2,$3,$4,$5)',
                values: [postdata.qty, postdata.trxn_type, postdata.set_price, postdata.coin_id, status],
            }
            const result1 = await pool.query(query);
            if (result1.rowCount > 0) {
                const result2 = await pool.query('UPDATE public.user_detail SET acc_balance = acc_balance + ' + required_price);
                return res.end(JSON.stringify({ status:200,response: "Coin sold from your account" }));
            }
        } else { //queued upto equal price
            let status = 'QUEUED';
            const query = {
                text: 'INSERT INTO public.user_trxn_detail(qty, trxn_type, set_price, coin_id, status) VALUES($1,$2,$3,$4,$5)',
                values: [postdata.qty, postdata.trxn_type, postdata.set_price, postdata.coin_id, status],
            }
            const result1 = await pool.query(query);
            if (result1.rowCount > 0) {
                return res.end(JSON.stringify({ status:200,response: "Coin sold request queued in your account" }));
            }
        }
        await pool.end();
    }
    catch (err) {
        console.log(err)
    }
})
//Selling the coin API
app.get('/accountbalance', async function (req, res) {
    try {
        var pool = new Pool(pgconfig);
        pool.connect();
        const result = await pool.query('SELECT acc_balance from public.user_detail');
        res.end(JSON.stringify({ response: result.rows[0] }));
        await pool.end();
    }
    catch (err) {
        console.log(err)
    }
})
//Selling the coin API
app.get('/getqueuedRequest', async function (req, res) {
    try {
        var pool = new Pool(pgconfig);
        pool.connect();
        const result = await pool.query("SELECT qty, trxn_type, set_price, coin_id, status FROM public.user_trxn_detail Where status='QUEUED'");
        if(result.rowCount > 0){
            res.end(JSON.stringify({ response: result.rows[0] }));
        } else {
            res.end(JSON.stringify({ status: 404 }));
        }
        await pool.end();
    }
    catch (err) {
        console.log(err)
    }
})


cron.schedule('* * * * * *', () => {
    axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=USD')
        .then(async function (response) {
            // handle success
            // console.log(response.data);
            var pool = new Pool(pgconfig);
            pool.connect();

            let currentPrice = response.data.ethereum;

            const result = await pool.query("SELECT trxn_type,status,qty,set_price from public.user_trxn_detail where status='QUEUED'");
            if (result.rows[0]) {
                let required_price = parseInt(result.rows[0].qty) * parseFloat(result.rows[0].set_price);
                if (result.rows[0].set_price == currentPrice.usd) {
                    const result1 = await pool.query("UPDATE public.user_trxn_detail SET status ='SUCCESS'");
                    if (result1.rowCount > 0 && result.rows[0].trxn_type == 'BUY') {
                        const result2 = await pool.query('UPDATE public.user_detail SET acc_balance = acc_balance - ' + required_price);
                    }
                    if (result1.rowCount > 0 && result.rows[0].trxn_type == 'SELL') {
                        const result2 = await pool.query('UPDATE public.user_detail SET acc_balance = acc_balance + ' + required_price);
                    }
                }
            }
            await pool.end();

        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
});
var server = app.listen(3001, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Coin app listening at http://%s:%s", host, port)
})