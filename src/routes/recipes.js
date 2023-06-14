const express = require('express')
const router = express.Router()
const axios = require('axios')
require('dotenv').config()
const { Recipe, Diets, Op } = require('../db')
const { API_KEY, API_URL } = process.env


// LLAMAR A LA API
const getApiInfo = async () => {
    try {
        const resAxios = await axios(`${API_URL}/recipes/complexSearch?apiKey=${API_KEY}&addRecipeInformation=true&number=100`)
        const { results } = resAxios.data

        if(results.length > 0){
            let response = await results?.map((result)=> {
                return {
                    name: result.title,
                    vegetarian: result.vegetarian,
                    vegan: result.vegan,
                    glutenFree: result.glutenFree,
                    dairyFree: result.dairyFree, 
                    image: result.image, 
                    idApi: result.id, 
                    score: result.spoonacularScore,
                    healthScore: result.healthScore,
                    types: result.dishTypes?.map(element => element),  
                    diets: result.diets?.map(element => element), 
                    summary:result.summary, 
                    steps: (result.analyzedInstructions[0] && result.analyzedInstructions[0].steps?result.analyzedInstructions[0].steps.map(item=>item.step).join(" \n"):'')
                }
            })
            return response
        }
    } 
    catch (error) {
        return('error')
    }
}

// LLAMAR A LA DB

const getDBInfo = async() => {
    try {
        const dataDB = await Recipe.findAll({
            include: {
                model: Diets,
                attributes: ["name"],
                through:{
                    attributes: []
                }
            }
        })
        let response = await dataDB?.map(recipe => {
            return {
                id: recipe.id,
                name: recipe.name,
                image: recipe.image,
                summary: recipe.summary,
                score: recipe.score,
                steps: recipe.steps,
                diets: recipe.diets?.map(diet => diet.name)
            }
        })
        return response
    }
    catch (error) {
        return('error')
    }
}

//JUNTAMOS LA INFO DE LA DB CON LA DE LA API

const getAllInfo = async() => {
    try {
        const apiInfo = await getApiInfo()
        const dbInfo = await getDBInfo()
        const infoTotal = apiInfo.concat(dbInfo)
        return infoTotal
    } 
    catch (error) {
        return('error')
    }
}

//CONSEGUIR INFO DE LA API POR NAME

const getApiByName = async(name) => {
    try {
        const resAxios = await axios(`${API_URL}/recipes/complexSearch?query=${name}&addRecipeInformation=true&number=100&apiKey=${API_KEY}`)
        const { results } = resAxios.data
        if(results.length > 0){
            let response = results?.map((result) => {
                return {
                    name: result.title,
                            vegetarian: result.vegetarian,
                            vegan: result.vegan,
                            glutenFree: result.glutenFree,
                            dairyFree: result.dairyFree, 
                            image: result.image, 
                            idApi: result.id, 
                            healthScore: result.healthScore,
                            types: result.dishTypes?.map(element => element),  
                            diets: result.diets?.map(element => element), 
                            steps: (result.analyzedInstructions[0] && result.analyzedInstructions[0].steps?result.analyzedInstructions[0].steps.map(item=>item.step).join(" \n"):'')
                }
            })
            return response
        }
        
    } catch (error) {
        return('error')
    }
}

//CONSEGUIR INFO DE LA DB POR NAME

const getDBByName = async(name) => {
    try {
        const DBInfo = await getDBInfo();
        const filtrarName = DBInfo.filter(recipe => recipe.name.includes(name))

        return filtrarName
    } 
    catch (error) {
        return('error')
    }
}

//CONSEGUIR TODA LA INFO DE DB Y API POR NAME

const getInfoByName = async(name) => {
    try {
        const apiByName = await getApiByName(name)
        const DBByName = await getDBByName(name)
        const infoTotal = apiByName.concat(DBByName)
        return infoTotal
    } 
    catch (error) {
        return('error')
    }
}


//RUTA PARA BUSCAR POR ID

router.get('/:id', async(req, res)=> {
    const { id } = req.params

    try {
        if(id.length > 12){
            const dataDB = await Recipe.findByPk(id, {
                include: {
                    model: Diets,
                    attributes: ["name"],
                    through: {
                        attributes: [],
                    },
                }
            })
            if(dataDB){
                const recipeDB = {
                    id: dataDB.id,
                    name: dataDB.name,
                    image: dataDB.image,
                    summary: dataDB.summary,
                    healthScore: dataDB.score,
                    steps: dataDB.steps,
                    diets: dataDB.diets?.map(diet => diet.name)
                }
                res.status(200).json(recipeDB)
            }
        }else{

            const resAxios = await axios(`${API_URL}/recipes/${id}/information?apiKey=${API_KEY}&addRecipeInformation=true&number=100`)
            let result = resAxios.data
            let recipeApi = {}

            recipeApi = {
                name: result.title, 
                vegetarian: result.vegetarian,
                vegan: result.vegan,
                glutenFree: result.glutenFree,
                dairyFree: result.dairyFree,
                image: result.image, 
                idApi: result.id,
                summary: result.summary,
                healthScore: result.healthScore, 
                diets: result.diets?.map(element => element),
                steps: result.instructions
            }
            if(recipeApi){
                res.status(200).json(recipeApi)
            }else {
                throw new Error("Receta no encontrada")
            }
        }
    } 
    catch (error) {
        return res.status(500).json({error: error.message})
    }
})


//RUTA PARA BUSCAR POR NAME

router.get('/', async(req, res)=> {
    const { name } = req.query

    if (name) {
    
        const infoByName = await getInfoByName(name);
        if (infoByName !== 'error'){
            infoByName.length > 0 ? res.json(infoByName) : res.status(400).json([{ name: 'Receta no encontrada'}]);
        }else{
            res.status(404).json([{ name: 'Error'}])
        }

    }else{
        const allDate = await getAllInfo() 
        if (allDate !== 'error'){  
            res.json(allDate);
        }else{
            res.status(404).json({message:'Error en la búsqueda de datos'})
        }
    }
})

module.exports = router
