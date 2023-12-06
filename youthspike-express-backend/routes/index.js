const express = require('express');
const router = express.Router();



router.get('/home', (req, res, next) => {
    res.status(200).json({ "Msg": "success" });
});




module.exports = router;