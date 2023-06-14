const express = require('express')
const router = express.Router()
const { Diets } = require('../db');

router.get('/', async(req, res)=> {
    try {
        let tipoDietas = await Diets.findAll()
        res.status(200).json(tipoDietas)
    } 
    catch (error) {
        return res.status(500).json({error: error.message})
    }
})

module.exports = router