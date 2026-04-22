const express = require('express');
const router = express.Router();

async function loginViewController(req, res, next) 
{
    try{ return res.status(200).render(`../views/login.ejs`) }
    catch(error){ next(error) }
}

async function dashboardViewController(req, res, next) 
{
    try{ return res.status(200).render(`../views/dashboard.ejs`) }
    catch(error){ next(error) }
}

router.get('/login', loginViewController);
router.get('/dashboard', dashboardViewController);

module.exports = router;
