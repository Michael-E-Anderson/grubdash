const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//  Function to check that all properties of dish are present for creation
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if (data[propertyName]) {
            return next()
        }
        next({ status: 400, message: `Must include a ${propertyName}` })
    }
};

// checks the validty of the price
function priceChecker (req, res, next) {
    if (req.body.data.price > 0 && Number.isInteger(req.body.data.price)) {
      return next();
    } next({
          status: 400,
          message: `Must include a price greater than 0`,
        });
    
};

// creates dish
function create (req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body
    const newDish = {
        id: `${nextId}`,
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish })
};

// lists all dishes
function list(req, res) {
   res.json({ data: dishes }) 
}

// Checks that the dish exists
function dishExists(req, res, next) {
    try {
        const { dishId } = req.params
    const foundDish = dishes.find((dish) => dish.id === dishId)

    if (foundDish) {
        res.locals.dish = foundDish
        return next()
    } else {
        next({ status: 404 })
    }
} catch(err) {
    console.log("exists")
}

}

// lists a single dish
function read(req, res) {
    try {
        res.json({ data: res.locals.dish })
    } catch(err){
        console.log("read")
    }
}

// validates that id in body matches id in route
function idIsValid(req, res, next) {
    const routeId = Number(req.params.dishId)

    if(req.body.data.id){
        const validId = req.body.data.id == routeId;
        if (validId) {
          return next();
        }
        next({
          status: 400,
          message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${routeId}`,
        });
    } next()
    
}

// updates a dish
function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish })
}



module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    priceChecker,
    bodyDataHas("image_url"),
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
      dishExists,
      bodyDataHas("name"),
      bodyDataHas("description"),
      bodyDataHas("price"),
      bodyDataHas("image_url"),
      priceChecker,
      idIsValid,
      update,
    ]
};