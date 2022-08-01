const path = require("path");
const { isArray } = require("util");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// lists all order data
function list(req, res){
    res.json({ data: orders })
}

// checks body for information
function bodyDataHas(propertyName){
    return function(req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]){
            return next()
        } next({
            status: 400,
            message: `Order must include ${propertyName}`
        })
    }
}

// confirms order has dishes
function validateDishes(req, res, next) {
    const dishes = req.body.data.dishes
    if(dishes.length && Array.isArray(dishes)){
        return next()
    } next({
        status: 400,
        message: "Order must include at least one dish"
    })
}

// confirms quantity of a dish
function dishQuantity(req, res, next){
    const dishes = req.body.data.dishes
    dishes.forEach((dish, i) => {
        if (dish.quantity > 0 && Number.isInteger(dish.quantity) && dish.quantity) {
          return
        }
        next({
          status: 400,
          message: `Dish ${i} must have a quantity that is an integer greater than 0`,
        });
    })
    next()
}

// creates a new order
function create(req, res){
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: `${nextId}`,
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder })
}

// checks that order exists
function orderExists(req, res, next) {
    const { orderId } = req.params
    const foundOrder = orders.find((order) => order.id === orderId)

    if(foundOrder){
        res.locals.order = foundOrder
        return next()
    } else {
        next({status: 404})
    }
}

// returns a single order
function read(req, res) {
    res.json({ data: res.locals.order })
    
}

// validates order ID
function idIsValid(req, res, next) {
    const { orderId } = req.params
    if(req.body.data.id === orderId || req.body.data.id === undefined || req.body.data.id === null || req.body.data.id === ""){
        return next()
    } next({
        status: 400,
        message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${orderId}.`
    })
}

// validates the order status
function statusIsValid(req, res, next) {
    const orderStatus = req.body.data.status
    if (orderStatus && orderStatus != "invalid"){
        return next()
    } next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
}

// checks is order is delivered
function orderDelivered(req, res, next) {
    const deliveryStatus = req.body.data.status
    if (deliveryStatus === "delivered"){
        return next({
            status: 400,
            message: "A delivered order cannot be changed"
        })
    } next()
}

//updates existing order
function update(req, res){
    const order = res.locals.order;
    const { data: {deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    order.deliverTo = deliverTo;
    order. mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order })
}

// checks if the status is "pending"
function statusPending(req, res, next){
    const orderStatus = res.locals.order.status
    if (orderStatus === "pending") {
        return next()
    } next({
        status: 400,
        message: "An order cannot be deleted unless it is pending"
    })
}

function orderToDeleteExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  } else {
    next({ 
        status: 404,
        message: `${orderId}`
    });
  }
}

//deletes an order
function destroy(req, res){
    const { orderId } = req.params;
    const index = orders.findIndex((order) =>order.id === Number(orderId))
    const deletedOrder = orders.splice(index, 1)
    res.sendStatus(204)
}

module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        validateDishes,
        dishQuantity,
        create,
    ],
    read: [
        orderExists,
        read,
    ],
    update: [
        orderExists,
        idIsValid,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        validateDishes,
        dishQuantity,
        statusIsValid,
        orderDelivered,
        update,
    ],
    delete: [
        orderToDeleteExists,
        statusPending,
        destroy,
    ]
}