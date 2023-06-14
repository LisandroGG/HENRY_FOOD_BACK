const express = require('express')
const router = express.Router()
require('dotenv').config();
const { Recipe, Diets, Op } = require('../db');

router.post('/', async(req, res)=> {
    
    let { name, image, summary, score, steps, diets } = req.body
    console.log(name, image, summary,score, steps, diets)
    if(!name || !image || !summary || !score || !steps) res.status(404).send('Faltan datos por completar')
    try {
        let recipeCreate = await Recipe.create({ name, image, summary, score, steps})

        let dietDB = await Diets.findAll({
            where: {name: diets}
        })

        recipeCreate.addDiets(dietDB)
        res.status(200).json(recipeCreate)
    } 
    catch (error) {
        return res.status(500).json({error: error.message})
    }
})


module.exports = router

